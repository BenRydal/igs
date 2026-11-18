import { EXAMPLE, loadedExample, runCommand } from '../lib.mjs'

export default async function (ctx) {
  const { page } = ctx
  await loadedExample(ctx)
  const panel = page.getByRole('tabpanel', { name: 'Data panel' })
  const detail = (text) => panel.getByText(text, { exact: true })
  const loadedInk = await ctx.canvasInk()

  await panel.getByRole('button', { name: 'Clear conversation' }).click()
  await detail('1 speaker').waitFor({ state: 'hidden' })
  await ctx.shot('panel-cleared-conversation')
  ctx.check(await detail('2 people').isVisible(), 'movement survives clearing conversation')

  await panel.getByRole('button', { name: 'Clear codes' }).click()
  await detail('3 codes').waitFor({ state: 'hidden' })
  await ctx.shot('panel-cleared-codes')
  ctx.check(
    !(await page.getByRole('tab', { name: 'Codes', exact: true }).isVisible()),
    'Codes tab leaves with the codes'
  )

  await panel.getByRole('button', { name: 'Clear movement' }).click()
  await detail('2 people').waitFor({ state: 'hidden' })
  await page.waitForTimeout(500)
  const clearedInk = await ctx.canvasInk()
  await ctx.shot('panel-cleared-movement')
  ctx.check(
    clearedInk < loadedInk * 0.8,
    `paths left the canvas (ink ${loadedInk} -> ${clearedInk})`
  )

  await runCommand(page, 'jordan', /Load: Michael Jordan's Last Shot/)
  await detail('2 people').waitFor()
  await detail('3 codes').waitFor()
  await page.waitForTimeout(1500)
  await ctx.shot('example-loaded-via-palette')
  ctx.check(
    await page.getByText(EXAMPLE, { exact: true }).first().isVisible(),
    'header names the dataset loaded from the palette'
  )

  await runCommand(page, 'clear conversation data', /Clear Conversation Data/)
  await detail('1 speaker').waitFor({ state: 'hidden' })
  await runCommand(page, 'clear code data', /Clear Code Data/)
  await detail('3 codes').waitFor({ state: 'hidden' })
  await runCommand(page, 'clear movement data', /Clear Movement Data/)
  await detail('2 people').waitFor({ state: 'hidden' })
  await ctx.shot('palette-cleared-each-kind')

  await runCommand(page, 'jordan', /Load: Michael Jordan's Last Shot/)
  await detail('2 people').waitFor()
  await page.waitForTimeout(1500)
  await runCommand(page, 'clear all data', /Clear All Data/)
  await page.getByText('Nothing loaded yet').waitFor()
  await ctx.shot('palette-cleared-all')
  ctx.noPageErrors()
}
