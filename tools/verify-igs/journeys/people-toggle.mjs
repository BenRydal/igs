import { loadedExample } from '../lib.mjs'

export default async function (ctx) {
  const { page } = ctx
  await loadedExample(ctx)
  await ctx.openPanel('People')
  const shown = await ctx.canvasInk()
  await ctx.shot('people-panel')

  await page.getByRole('button', { name: 'Hide movement for jordan' }).click()
  await page.getByRole('button', { name: 'Show movement for jordan' }).waitFor()
  await page.waitForTimeout(400)
  const hidden = await ctx.canvasInk()
  await ctx.shot('jordan-movement-hidden')
  ctx.check(hidden < shown * 0.8, `hiding movement removed the path (ink ${shown} -> ${hidden})`)

  await page.getByRole('button', { name: 'Show movement for jordan' }).click()
  await page.getByRole('button', { name: 'Hide movement for jordan' }).waitFor()
  await page.waitForTimeout(400)
  const restored = await ctx.canvasInk()
  await ctx.shot('jordan-movement-restored')
  ctx.check(
    Math.abs(restored - shown) < shown * 0.05,
    `showing movement restored the path (ink ${shown} -> ${restored})`
  )
  ctx.noPageErrors()
}
