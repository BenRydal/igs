import { loadedExample } from '../lib.mjs'

export default async function (ctx) {
  const { page } = ctx
  await loadedExample(ctx)
  const before = await ctx.canvasInk()

  await page.keyboard.press('Control+k')
  const dialog = page.getByRole('dialog')
  const search = dialog.getByRole('combobox', { name: 'Search commands...' })
  await search.waitFor()
  await search.fill('movement trails')
  await ctx.shot('palette-filtered')
  ctx.check(
    await dialog.getByRole('option', { name: /Toggle Movement Trails/ }).isVisible(),
    'fuzzy search finds the command'
  )
  await page.keyboard.press('Enter')
  await search.waitFor({ state: 'hidden' })
  await page.waitForTimeout(500)
  const off = await ctx.canvasInk()
  await ctx.shot('movement-off-via-palette')
  ctx.check(off < before * 0.95, `command hid movement trails (ink ${before} -> ${off})`)

  await page.keyboard.press('Control+z')
  await page.waitForTimeout(500)
  const undone = await ctx.canvasInk()
  await ctx.shot('undo')
  ctx.check(
    Math.abs(undone - before) < before * 0.02,
    `undo restored the trails (ink ${before} -> ${undone})`
  )

  await page.keyboard.press('Control+Shift+z')
  await page.waitForTimeout(500)
  const redone = await ctx.canvasInk()
  await ctx.shot('redo')
  ctx.check(
    Math.abs(redone - off) < before * 0.02,
    `redo hid them again (ink ${before} -> ${redone})`
  )
  ctx.noPageErrors()
}
