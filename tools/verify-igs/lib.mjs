import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const TOUR_DONE = JSON.stringify({ hasCompleted: true, version: '1.0', completedAt: 0 })

export async function createContext(browser, { base, outDir }) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  await context.addInitScript((tour) => {
    if (!localStorage.getItem('igs-tour-state')) localStorage.setItem('igs-tour-state', tour)
  }, TOUR_DONE)
  const page = await context.newPage()
  const consoleLines = []
  const pageErrors = []
  page.on('console', (m) => consoleLines.push(`[${m.type()}] ${m.text()}`))
  page.on('pageerror', (e) => {
    pageErrors.push(String(e))
    consoleLines.push(`[pageerror] ${e}`)
  })
  const steps = []
  let n = 0

  const ctx = {
    page,
    base,
    outDir,
    steps,
    consoleLines,
    pageErrors,
    async open(path = '/') {
      await page.goto(base + path, { waitUntil: 'networkidle' })
      await page.locator('canvas').first().waitFor({ state: 'visible' })
    },
    async shot(label) {
      n += 1
      const name = `${String(n).padStart(2, '0')}-${label}`
      await page.screenshot({ path: join(outDir, `${name}.png`) })
      writeFileSync(join(outDir, `${name}.aria.txt`), await page.locator('body').ariaSnapshot())
      steps.push(name)
      return name
    },
    async step(label, fn) {
      await fn()
      await ctx.shot(label)
    },
    check(condition, message) {
      if (!condition) throw new Error(`check failed: ${message}`)
    },
    async canvasInk() {
      const png = (await page.locator('canvas').first().screenshot()).toString('base64')
      return page.evaluate(async (b64) => {
        const img = new Image()
        img.src = `data:image/png;base64,${b64}`
        await img.decode()
        const probe = document.createElement('canvas')
        probe.width = 320
        probe.height = 200
        const g = probe.getContext('2d')
        g.drawImage(img, 0, 0, probe.width, probe.height)
        const { data } = g.getImageData(0, 0, probe.width, probe.height)
        const [r0, g0, b0] = data
        let ink = 0
        for (let i = 0; i < data.length; i += 4) {
          if (Math.abs(data[i] - r0) + Math.abs(data[i + 1] - g0) + Math.abs(data[i + 2] - b0) > 24)
            ink += 1
        }
        return ink
      }, png)
    },
    async openPanel(name) {
      const tab = page.getByRole('tab', { name, exact: true })
      if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click()
      await page.getByRole('tabpanel', { name: `${name} panel` }).waitFor()
    },
    async loadExample(label) {
      await ctx.openPanel('Data')
      await page.getByRole('searchbox', { name: 'Filter examples' }).fill(label)
      await page.getByRole('button', { name: label }).first().click()
      await page.getByRole('tab', { name: 'People', exact: true }).waitFor()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)
    },
    noPageErrors() {
      ctx.check(pageErrors.length === 0, `page errors: ${pageErrors.join(' | ')}`)
    },
    async close() {
      await context.close()
    },
  }
  return ctx
}

export const EXAMPLE = "Michael Jordan's Last Shot"
export const timeText = (page) => page.getByText(/^\d+:\d\d\s*\/\s*\d+:\d\d$/)
export const currentSeconds = async (page) => {
  const [m, s] = (await clock(page)).split(' / ')[0].split(':').map(Number)
  return m * 60 + s
}
export const clock = async (page) => (await timeText(page).innerText()).replace(/\s+/g, ' ').trim()
export const timelineTrack = (page) => page.locator('.igs-timeline-main .timeline-track')
export const overviewWindow = (page) =>
  page.locator('.igs-timeline-overview .timeline-track__selection')

export async function loadedExample(ctx) {
  await ctx.open('/')
  await ctx.loadExample(EXAMPLE)
  await ctx.page.getByRole('button', { name: 'Got it' }).click()
}
