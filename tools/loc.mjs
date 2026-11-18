#!/usr/bin/env node
import { execFileSync } from 'node:child_process'

const base = process.argv[2] ?? 'origin/main'
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 })
const isSource = (file) => /\.(ts|js|svelte|css)$/.test(file)
const isTest = (file) => file.includes('.test.')

function count(ref) {
  const files = git('ls-tree', '-r', '--name-only', ref, '--', 'src').split('\n').filter(isSource)
  const lines = (list) =>
    list.reduce((sum, file) => sum + git('show', `${ref}:${file}`).split('\n').length - 1, 0)
  return { source: lines(files.filter((f) => !isTest(f))), tests: lines(files.filter(isTest)) }
}

const before = count(base)
const after = count('HEAD')
const delta = (a, b) => `${b - a > 0 ? '+' : ''}${b - a} (${(((b - a) / a) * 100).toFixed(1)}%)`
console.table({
  'src, not tests': {
    [base]: before.source,
    HEAD: after.source,
    change: delta(before.source, after.source),
  },
  'src tests': {
    [base]: before.tests,
    HEAD: after.tests,
    change: delta(before.tests, after.tests),
  },
})
