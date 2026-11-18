import { loadedExample } from '../lib.mjs'

export default async function (ctx) {
  const { page } = ctx
  await loadedExample(ctx)
  const threeD = await ctx.canvasInk()
  await ctx.shot('3d')

  await page.getByRole('button', { name: 'Space-time' }).click()
  await page.waitForTimeout(1500)
  const twoD = await ctx.canvasInk()
  await ctx.shot('2d')
  ctx.check(
    Math.abs(twoD - threeD) > threeD * 0.1,
    `2D view differs from 3D (ink ${threeD} -> ${twoD})`
  )

  await page.keyboard.press('d')
  await page.waitForTimeout(1500)
  const back = await ctx.canvasInk()
  await ctx.shot('3d-again-via-D-key')
  ctx.check(
    Math.abs(back - threeD) < threeD * 0.1,
    `D key returned to 3D (ink ${threeD} -> ${back})`
  )
  ctx.noPageErrors()
}
