#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import { chromium } from 'playwright'

const TOOL_DIR = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(TOOL_DIR, '../..')
const PORT = Number(process.env.IGS_LOADTEST_PORT ?? 5198)
const BASE = `http://127.0.0.1:${PORT}`
const RUNS = Number(process.env.IGS_LOADTEST_RUNS ?? 3)
const IMPORT_TIMEOUT_MS = 240_000
const FLOORPLAN = {
  path: join(REPO, 'static/data/example-1/floorplan.png'),
  width: 1534,
  height: 1918,
}
const RECORDING_SECONDS = 3600

const DEFAULT_CASES = ['1x10000', '1x100000', '1x1000000', '10x100000', '30x30000']
const argv = process.argv.slice(2)
const outArg = argv.indexOf('--out')
const outValue = outArg >= 0 ? argv.splice(outArg, 2)[1] : undefined
const cases = (argv.length ? argv : DEFAULT_CASES).map((spec) => {
  const [people, points] = spec.split('x').map(Number)
  return { spec, people, points, total: people * points }
})
const OUT = resolve(outValue ?? join(TOOL_DIR, 'artifacts', `loadtest-${Date.now()}`))

const PROFILE = process.env.IGS_LOADTEST_PROFILE === '1'

function hotspots(profile) {
  const self = new Map()
  const byId = new Map(profile.nodes.map((n) => [n.id, n]))
  const dt = profile.timeDeltas
  profile.samples.forEach((id, i) => {
    const f = byId.get(id).callFrame
    const key = `${f.functionName || '(anonymous)'} ${f.url.split('/').pop()}:${f.lineNumber + 1}`
    self.set(key, (self.get(key) ?? 0) + (dt[i] ?? 0))
  })
  const total = [...self.values()].reduce((a, b) => a + b, 0)
  return [...self.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([name, us]) => `${((us / total) * 100).toFixed(1)}% ${Math.round(us / 1000)}ms ${name}`)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? s[Math.floor(s.length / 2)] : null
}
const quantile = (xs, q) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * q))] : null
}

function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function writeDataset(dir, { people, points }) {
  const files = [join(dir, 'floorplan.png')]
  copyFileSync(FLOORPLAN.path, files[0])
  let bytes = 0
  for (let p = 0; p < people; p++) {
    const rand = mulberry32(1000 + p)
    let x = FLOORPLAN.width * rand()
    let y = FLOORPLAN.height * rand()
    let pausedUntil = -1
    const rows = ['time,x,y']
    const dt = RECORDING_SECONDS / points
    for (let i = 0; i < points; i++) {
      const t = i * dt
      if (t >= pausedUntil) {
        if (rand() < 0.002) pausedUntil = t + 5 + rand() * 60
        x = Math.min(FLOORPLAN.width, Math.max(0, x + (rand() - 0.5) * 12))
        y = Math.min(FLOORPLAN.height, Math.max(0, y + (rand() - 0.5) * 12))
      }
      rows.push(`${t.toFixed(3)},${x.toFixed(1)},${y.toFixed(1)}`)
    }
    const file = join(dir, `person${String(p + 1).padStart(2, '0')}.csv`)
    const text = rows.join('\n') + '\n'
    bytes += text.length
    writeFileSync(file, text)
    files.push(file)
  }
  return { files, bytes }
}

async function startPreview() {
  const child = spawn(
    'yarn',
    ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
    {
      cwd: REPO,
      detached: true,
      stdio: 'ignore',
    }
  )
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(BASE)
      if (res.ok && (await res.text()).includes('<title>IGS')) return child
    } catch {
      await sleep(250)
    }
    await sleep(250)
  }
  process.kill(-child.pid, 'SIGTERM')
  throw new Error('preview server did not start; run `yarn build` first')
}

async function canvasInk(page) {
  const png = (await page.locator('canvas').first().screenshot()).toString('base64')
  return page.evaluate(async (b64) => {
    const img = new Image()
    img.src = `data:image/png;base64,${b64}`
    await img.decode()
    const c = document.createElement('canvas')
    c.width = 320
    c.height = 200
    const g = c.getContext('2d')
    g.drawImage(img, 0, 0, 320, 200)
    const { data } = g.getImageData(0, 0, 320, 200)
    let ink = 0
    for (let i = 0; i < data.length; i += 4) {
      if (
        Math.abs(data[i] - data[0]) +
          Math.abs(data[i + 1] - data[1]) +
          Math.abs(data[i + 2] - data[2]) >
        24
      )
        ink += 1
    }
    return ink
  }, png)
}

async function sampleFrames(page, ms) {
  return page.evaluate(
    (duration) =>
      new Promise((done) => {
        const deltas = []
        let last = performance.now()
        const end = last + duration
        const tick = (now) => {
          deltas.push(now - last)
          last = now
          if (now < end) requestAnimationFrame(tick)
          else done(deltas)
        }
        requestAnimationFrame(tick)
      }),
    ms
  )
}

async function runOnce(browser, dataset, testCase) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await context.addInitScript(() =>
    localStorage.setItem(
      'igs-tour-state',
      JSON.stringify({ hasCompleted: true, version: '1.0', completedAt: 0 })
    )
  )
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  const result = { ok: false, errors }
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.locator('canvas').first().waitFor()
    const emptyInk = await canvasInk(page)
    const tab = page.getByRole('tab', { name: 'Data', exact: true })
    if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click()
    await page.getByRole('button', { name: 'Import files' }).click()
    await page.locator('input[type=file]').setInputFiles(dataset.files)
    const importButton = page
      .getByRole('dialog', { name: 'Import Data' })
      .getByRole('button', { name: /^Import \d+ files$/ })
    await importButton.waitFor()

    if (PROFILE) {
      await cdp.send('Profiler.enable')
      await cdp.send('Profiler.setSamplingInterval', { interval: 1000 })
      await cdp.send('Profiler.start')
    }
    const started = Date.now()
    await importButton.click()
    const expected = testCase.people === 1 ? '1 person' : `${testCase.people} people`
    await page
      .getByRole('tabpanel', { name: 'Data panel' })
      .getByText(expected, { exact: true })
      .waitFor({ timeout: IMPORT_TIMEOUT_MS })
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    )
    result.importMs = Date.now() - started

    if (PROFILE) result.importHotspots = hotspots((await cdp.send('Profiler.stop')).profile)
    const hint = page.getByRole('button', { name: 'Got it' })
    if (await hint.isVisible().catch(() => false)) await hint.click()
    await page.getByRole('button', { name: 'Close panel' }).click()
    await page.waitForTimeout(500)
    result.ink = await canvasInk(page)
    result.drew = result.ink > emptyInk * 3

    await cdp.send('HeapProfiler.collectGarbage')
    result.heapMb = Math.round((await cdp.send('Runtime.getHeapUsage')).usedSize / 1048576)

    const idle = await sampleFrames(page, 2000)
    result.idleFrameMs = median(idle)

    if (PROFILE) await cdp.send('Profiler.start')
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await page.getByRole('button', { name: 'Pause', exact: true }).waitFor({ timeout: 60_000 })
    const playing = await sampleFrames(page, 5000)
    result.playFrames = playing.length
    result.playFrameMedianMs = median(playing)
    result.playFrameP95Ms = quantile(playing, 0.95)
    if (PROFILE) result.playHotspots = hotspots((await cdp.send('Profiler.stop')).profile)
    await page.getByRole('button', { name: 'Pause', exact: true }).click({ timeout: 60_000 })

    const settle = () =>
      page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    const timed = async (action) => {
      const t0 = Date.now()
      await action()
      await settle()
      return Date.now() - t0
    }
    if (PROFILE) await cdp.send('Profiler.start')
    const track = await page.locator('canvas.touch-none').boundingBox()
    result.seekRedrawMs = await timed(() =>
      page.mouse.click(track.x + track.width * 0.9, track.y + track.height / 2)
    )
    await page.mouse.move(700, 300)
    result.filterRedrawMs = await timed(() => page.keyboard.press('s'))
    result.filterRedrawAgainMs = await timed(() => page.keyboard.press('s'))
    result.viewToggleMs = await timed(() =>
      page.getByRole('button', { name: 'Space-time' }).click()
    )
    result.viewToggleBackMs = await timed(() =>
      page.getByRole('button', { name: 'Space-time' }).click()
    )
    if (PROFILE) result.interactionHotspots = hotspots((await cdp.send('Profiler.stop')).profile)

    result.ok = result.drew && errors.length === 0
  } catch (error) {
    result.failure = String(error?.message ?? error).split('\n')[0]
  } finally {
    await context.close()
  }
  return result
}

mkdirSync(OUT, { recursive: true })
const scratch = mkdtempSync(join(tmpdir(), 'igs-loadtest-'))
const preview = await startPreview()
const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
})
const summary = []
try {
  for (const testCase of cases) {
    const dir = join(scratch, testCase.spec)
    mkdirSync(dir)
    const dataset = writeDataset(dir, testCase)
    const runs = []
    for (let i = 0; i < RUNS; i++) {
      const r = await runOnce(browser, dataset, testCase)
      runs.push(r)
      console.log(`${testCase.spec} run ${i + 1}: ${JSON.stringify(r)}`)
      if (r.failure) break
    }
    const good = runs.filter((r) => r.ok)
    const pick = (key) => good.map((r) => r[key])
    summary.push({
      case: testCase.spec,
      totalPoints: testCase.total,
      csvMb: +(dataset.bytes / 1048576).toFixed(1),
      runs: runs.length,
      succeeded: good.length,
      failure: runs.find((r) => r.failure)?.failure,
      pageErrors: runs.flatMap((r) => r.errors).length,
      importMs: {
        median: median(pick('importMs')),
        min: Math.min(...pick('importMs')),
        max: Math.max(...pick('importMs')),
      },
      heapMb: median(pick('heapMb')),
      playFrameMedianMs: median(pick('playFrameMedianMs')),
      playFrameP95Ms: median(pick('playFrameP95Ms')),
      idleFrameMs: median(pick('idleFrameMs')),
      viewToggleMs: median(pick('viewToggleMs')),
      viewToggleBackMs: median(pick('viewToggleBackMs')),
      filterRedrawAgainMs: median(pick('filterRedrawAgainMs')),
      filterRedrawMs: median(pick('filterRedrawMs')),
      seekRedrawMs: median(pick('seekRedrawMs')),
      runDetail: runs,
    })
  }
} finally {
  await browser.close()
  process.kill(-preview.pid, 'SIGTERM')
  rmSync(scratch, { recursive: true, force: true })
}
writeFileSync(join(OUT, 'loadtest.json'), JSON.stringify(summary, null, 2))
console.table(
  summary.map((s) => ({
    case: s.case,
    points: s.totalPoints,
    csvMb: s.csvMb,
    ok: `${s.succeeded}/${s.runs}`,
    importMs: s.importMs.median,
    heapMb: s.heapMb,
    playMs: s.playFrameMedianMs && +s.playFrameMedianMs.toFixed(1),
    playP95: s.playFrameP95Ms && +s.playFrameP95Ms.toFixed(1),
    seekMs: s.seekRedrawMs,
    filterMs: s.filterRedrawMs,
    toggleMs: s.viewToggleMs,
    toggleBackMs: s.viewToggleBackMs,
    failure: s.failure?.slice(0, 60),
  }))
)
console.log(`results: ${join(OUT, 'loadtest.json')}`)
