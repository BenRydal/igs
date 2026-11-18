import { currentSeconds, loadedExample, timelineCanvas } from '../lib.mjs'

export default async function (ctx) {
  const { page } = ctx
  await loadedExample(ctx)
  ctx.check((await currentSeconds(page)) === 0, 'starts at 0:00')

  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await page.getByRole('button', { name: 'Pause', exact: true }).waitFor()
  await page.waitForFunction(
    () => /0:0[1-9]\s*\/|0:[1-3]\d\s*\//.test(document.body.innerText),
    null,
    { timeout: 60000 }
  )
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  await page.getByRole('button', { name: 'Play', exact: true }).waitFor()
  const paused = await currentSeconds(page)
  await ctx.shot('played-then-paused')
  ctx.check(paused > 0, `playback advanced the clock to ${paused}s`)
  await page.waitForTimeout(1200)
  ctx.check((await currentSeconds(page)) === paused, 'clock holds while paused')

  const box = await timelineCanvas(page).boundingBox()
  await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2)
  await page.waitForTimeout(300)
  const sought = await currentSeconds(page)
  await ctx.shot('click-to-seek')
  ctx.check(sought >= 26 && sought <= 30, `click at 75% seeks near 28s (got ${sought}s)`)

  const fit = page.getByRole('button', { name: 'Fit to view' })
  ctx.check(await fit.isDisabled(), 'Fit to view is disabled when not zoomed')
  await page.getByRole('button', { name: 'Zoom in' }).click()
  await ctx.shot('zoomed-in')
  ctx.check(await fit.isEnabled(), 'Zoom in enables Fit to view')
  await fit.click()
  ctx.check(await fit.isDisabled(), 'Fit to view resets the zoom')

  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2, { steps: 8 })
  await page.mouse.up()
  await ctx.shot('drag-to-zoom')
  ctx.check(await fit.isEnabled(), 'dragging a region zooms the timeline')
  await fit.click()

  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await page.waitForTimeout(300)
  await ctx.shot('reset')
  ctx.check((await currentSeconds(page)) === 0, 'Reset returns to 0:00')
  ctx.noPageErrors()
}
