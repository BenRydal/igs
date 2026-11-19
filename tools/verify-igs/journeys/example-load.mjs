import { EXAMPLE, clock } from '../lib.mjs'

export default async function (ctx) {
  const { page } = ctx
  await ctx.open('/')
  const emptyInk = await ctx.canvasInk()
  await ctx.shot('empty-state')
  ctx.check(await page.getByText('Nothing loaded yet').isVisible(), 'empty state copy is shown')

  await ctx.loadExample(EXAMPLE)
  await ctx.shot('example-loaded')
  const panel = page.getByRole('tabpanel', { name: 'Data panel' })
  for (const [kind, detail] of [
    ['Movement', '2 people'],
    ['Conversation', '1 speaker'],
    ['Codes', '3 codes'],
    ['Video', 'YouTube'],
  ]) {
    ctx.check(await panel.getByText(kind, { exact: true }).isVisible(), `${kind} row listed`)
    ctx.check(
      await panel.getByText(detail, { exact: true }).isVisible(),
      `${kind} shows "${detail}"`
    )
  }
  ctx.check(
    await page.getByText(EXAMPLE, { exact: true }).first().isVisible(),
    'header names the dataset'
  )
  ctx.check((await clock(page)) === '0:00 / 0:37', 'timeline spans 0:37')
  const loadedInk = await ctx.canvasInk()
  ctx.check(loadedInk > emptyInk * 5, `canvas drew the dataset (ink ${emptyInk} -> ${loadedInk})`)

  await page.getByRole('button', { name: 'Clear all' }).click()
  await page.getByText('Nothing loaded yet').waitFor()
  await ctx.shot('cleared')
  ctx.noPageErrors()
}
