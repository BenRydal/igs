#!/usr/bin/env node
import { spawn, execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import process from 'node:process'

const TOOL_DIR = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(TOOL_DIR, '../..')
const RUN_DIR = join(TOOL_DIR, '.run')
const STATE_FILE = join(RUN_DIR, 'server.json')
const PORT = Number(process.env.IGS_VERIFY_PORT ?? 5199)
const READY_TIMEOUT_MS = 90_000

const head = () => execFileSync('git', ['-C', REPO, 'rev-parse', 'HEAD']).toString().trim()
const dirty = () =>
  execFileSync('git', ['-C', REPO, 'status', '--porcelain', '--', 'src', 'static', 'package.json'])
    .toString()
    .trim() !== ''
const readState = () =>
  existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : null
const alive = (pid) => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function appAnswers(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/`)
    const body = await res.text()
    return res.ok && body.includes('<title>IGS')
  } catch {
    return false
  }
}

async function launch() {
  const prior = readState()
  if (prior && alive(prior.pid)) {
    console.log(`already running: pid ${prior.pid} port ${prior.port}`)
    return
  }
  if (await appAnswers(PORT)) {
    throw new Error(
      `port ${PORT} already serves IGS but this harness did not start it. Set IGS_VERIFY_PORT to a free port.`
    )
  }
  mkdirSync(RUN_DIR, { recursive: true })
  const log = join(RUN_DIR, 'server.log')
  const logFd = openSync(log, 'w')
  const child = spawn(
    'yarn',
    ['vite', 'dev', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
    {
      cwd: REPO,
      detached: true,
      stdio: ['ignore', logFd, logFd],
    }
  )
  child.unref()
  writeFileSync(STATE_FILE, JSON.stringify({ pid: child.pid, port: PORT, commit: head(), log }))
  const deadline = Date.now() + READY_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (!alive(child.pid)) throw new Error(`dev server exited early; see ${log}`)
    if (await appAnswers(PORT)) {
      console.log(`ready: http://127.0.0.1:${PORT} pid ${child.pid} commit ${head().slice(0, 7)}`)
      return
    }
    await sleep(500)
  }
  throw new Error(`dev server not ready after ${READY_TIMEOUT_MS} ms; see ${log}`)
}

async function doctor() {
  const state = readState()
  const checks = []
  checks.push(['state file', !!state, state ? STATE_FILE : 'missing: run `verify.mjs launch`'])
  if (state) {
    checks.push(['process alive', alive(state.pid), `pid ${state.pid}`])
    checks.push(['app answers', await appAnswers(state.port), `http://127.0.0.1:${state.port}`])
    checks.push([
      'serving current commit',
      state.commit === head(),
      `launched at ${state.commit.slice(0, 7)}, HEAD ${head().slice(0, 7)}`,
    ])
  }
  checks.push([
    'dependencies installed',
    existsSync(join(REPO, 'node_modules/.yarn-state.yml')),
    'yarn install',
  ])
  for (const [name, ok, detail] of checks) console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${detail}`)
  console.log(`info working tree ${dirty() ? 'has uncommitted changes under src/static' : 'clean'}`)
  if (checks.some(([, ok]) => !ok)) process.exit(1)
}

function stop() {
  const state = readState()
  if (!state) return console.log('nothing to stop')
  if (alive(state.pid)) {
    try {
      process.kill(-state.pid, 'SIGTERM')
    } catch {
      process.kill(state.pid, 'SIGTERM')
    }
  }
  rmSync(STATE_FILE)
  console.log(`stopped pid ${state.pid}`)
}

async function run(names, outArg) {
  const state = readState()
  if (!state || !alive(state.pid) || !(await appAnswers(state.port))) {
    throw new Error(
      'no healthy instance started by this harness: run `verify.mjs launch` then `doctor`'
    )
  }
  const all = readdirSync(join(TOOL_DIR, 'journeys'))
    .filter((f) => f.endsWith('.mjs'))
    .map((f) => f.replace(/\.mjs$/, ''))
    .sort()
  const wanted = names.length === 0 || names[0] === 'all' ? all : names
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outRoot = resolve(outArg ?? join(TOOL_DIR, 'artifacts', stamp))
  const { chromium } = await import('playwright')
  const { createContext } = await import('./lib.mjs')
  const browser = await chromium.launch({
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
    ],
  })
  const results = []
  for (const name of wanted) {
    const file = join(TOOL_DIR, 'journeys', `${name}.mjs`)
    if (!existsSync(file)) {
      results.push({ journey: name, ok: false, error: `no such journey; have: ${all.join(', ')}` })
      continue
    }
    const outDir = join(outRoot, name)
    mkdirSync(outDir, { recursive: true })
    const ctx = await createContext(browser, { base: `http://127.0.0.1:${state.port}`, outDir })
    const started = Date.now()
    try {
      const journey = (await import(pathToFileURL(file).href)).default
      await journey(ctx)
      results.push({ journey: name, ok: true, ms: Date.now() - started, steps: ctx.steps })
      console.log(`pass ${name} (${ctx.steps.length} steps)`)
    } catch (error) {
      await ctx.shot('FAILURE').catch(() => {})
      results.push({
        journey: name,
        ok: false,
        ms: Date.now() - started,
        steps: ctx.steps,
        error: String(error?.stack ?? error),
      })
      console.log(`FAIL ${name}: ${error?.message ?? error}`)
    } finally {
      writeFileSync(join(outDir, 'console.log'), ctx.consoleLines.join('\n'))
      await ctx.close()
    }
  }
  await browser.close()
  const summary = { commit: head(), dirty: dirty(), launchedAt: state.commit, when: stamp, results }
  writeFileSync(join(outRoot, 'result.json'), JSON.stringify(summary, null, 2))
  console.log(`evidence: ${outRoot}`)
  if (results.some((r) => !r.ok)) process.exit(1)
}

const [command, ...rest] = process.argv.slice(2)
const outIndex = rest.indexOf('--out')
const out = outIndex >= 0 ? rest.splice(outIndex, 2)[1] : undefined
const commands = { launch, doctor, stop, run: () => run(rest, out) }
if (!commands[command]) {
  console.error('usage: verify.mjs launch | doctor | stop | run [journey...|all] [--out <dir>]')
  process.exit(2)
}
try {
  await commands[command]()
} catch (error) {
  console.error(`error: ${error.message}`)
  process.exit(1)
}
