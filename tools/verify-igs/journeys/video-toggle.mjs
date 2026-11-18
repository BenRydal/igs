import { loadedExample } from '../lib.mjs'

export default async function (ctx) {
  const { page } = ctx
  await loadedExample(ctx)
  const frame = page.locator('iframe[src*="youtube.com/embed/iiMjfVOj8po"]')
  ctx.check(
    !(await frame.isVisible().catch(() => false)),
    'player is not on screen before Video is pressed'
  )
  const floatingInk = await ctx.canvasInk()
  await ctx.shot('before-video')

  await page.getByRole('button', { name: 'Video', exact: true }).click()
  await frame.waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForTimeout(1500)
  await ctx.shot('video-shown')
  ctx.check(await frame.isVisible(), 'YouTube player for the dataset is on screen')

  const box = await frame.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.getByRole('button', { name: 'Enter split screen' }).click()
  await page.waitForTimeout(2500)
  await ctx.shot('split-screen')
  const splitInk = await ctx.canvasInk()
  ctx.check(
    splitInk > floatingInk * 0.5,
    `the 3D view survives entering split screen (ink ${floatingInk} before, ${splitInk} split)`
  )
  await page.getByRole('button', { name: 'Exit split screen' }).click()
  await page.waitForTimeout(2500)
  await ctx.shot('floating-again')
  const againInk = await ctx.canvasInk()
  ctx.check(
    againInk > floatingInk * 0.5,
    `the 3D view survives leaving split screen (ink ${floatingInk} before, ${againInk} after)`
  )

  await page.getByRole('button', { name: 'Video', exact: true }).click()
  await page.waitForTimeout(600)
  await ctx.shot('video-hidden')
  ctx.check(!(await frame.isVisible().catch(() => false)), 'pressing Video again hides the player')
  ctx.noPageErrors()
}
