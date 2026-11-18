import { loadedExample } from '../lib.mjs'

export default async function (ctx) {
  const { page } = ctx
  await loadedExample(ctx)
  const frame = page.locator('iframe[src*="youtube.com/embed/iiMjfVOj8po"]')
  ctx.check(
    !(await frame.isVisible().catch(() => false)),
    'player is not on screen before Video is pressed'
  )
  await ctx.shot('before-video')

  await page.getByRole('button', { name: 'Video', exact: true }).click()
  await frame.waitFor({ state: 'visible', timeout: 20000 })
  await page.waitForTimeout(1500)
  await ctx.shot('video-shown')
  ctx.check(await frame.isVisible(), 'YouTube player for the dataset is on screen')

  await page.getByRole('button', { name: 'Video', exact: true }).click()
  await page.waitForTimeout(600)
  await ctx.shot('video-hidden')
  ctx.check(!(await frame.isVisible().catch(() => false)), 'pressing Video again hides the player')
  ctx.noPageErrors()
}
