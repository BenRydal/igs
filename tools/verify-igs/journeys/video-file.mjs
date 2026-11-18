import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { currentSeconds, timelineTrack } from '../lib.mjs'

const fixtures = join(fileURLToPath(new URL('.', import.meta.url)), '../fixtures')

export default async function (ctx) {
  const { page } = ctx
  const video = () =>
    page.evaluate(() => {
      const el = document.querySelector('video')
      return el && { time: el.currentTime, paused: el.paused, muted: el.muted }
    })
  const near = (a, b) => Math.abs(a - b) <= 1.5

  await ctx.open('/')
  await ctx.openPanel('Data')
  await page.getByRole('button', { name: 'Import files' }).click()
  const dialog = page.getByRole('dialog', { name: 'Import Data' })
  await page
    .locator('input[type=file]')
    .setInputFiles([join(fixtures, 'alex.csv'), join(fixtures, 'clip.mp4')])
  await dialog.getByRole('button', { name: 'Import 2 files' }).click()
  await dialog.waitFor({ state: 'hidden' })
  await page.getByRole('button', { name: 'Close panel' }).click()

  await page.getByRole('button', { name: 'Video', exact: true }).click()
  await page.locator('video').waitFor({ state: 'visible' })
  await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2)
  let v = await video()
  ctx.check(v.paused && v.time === 0, 'local video starts paused at 0')

  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('video')?.currentTime > 2, null, {
    timeout: 60000,
  })
  v = await video()
  ctx.check(!v.paused, 'Play starts the video')
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  await page.waitForTimeout(500)
  v = await video()
  const clock = await currentSeconds(page)
  await ctx.shot('played-then-paused')
  ctx.check(v.paused, 'Pause pauses the video')
  ctx.check(
    near(v.time, clock),
    `timeline clock follows the video (${clock}s, video ${v.time.toFixed(1)}s)`
  )

  const box = await timelineTrack(page).boundingBox()
  await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.2)
  await page.waitForTimeout(800)
  v = await video()
  const sought = await currentSeconds(page)
  await ctx.shot('seek-while-paused')
  ctx.check(
    near(v.time, sought),
    `seeking the timeline seeks the video (${sought}s, video ${v.time.toFixed(1)}s)`
  )
  ctx.check(v.paused, 'the video stays paused after a seek')

  const frame = await page.locator('video').boundingBox()
  await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 2)
  await page.getByRole('button', { name: 'Mute', exact: true }).click()
  ctx.check((await video()).muted, 'Mute mutes the video')
  await page.getByRole('button', { name: 'Unmute', exact: true }).click()
  ctx.check(!(await video()).muted, 'Unmute restores audio')

  await page.getByRole('button', { name: 'Mute', exact: true }).click()
  await page.getByRole('button', { name: 'Enter split screen' }).click()
  await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2)
  await page.waitForTimeout(800)
  v = await video()
  await ctx.shot('split-screen')
  ctx.check(
    near(v.time, sought),
    `split screen keeps the position (${sought}s, video ${v.time.toFixed(1)}s)`
  )
  ctx.check(v.paused, 'split screen keeps the video paused')
  ctx.check(v.muted, 'split screen keeps the video muted')

  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await page.waitForFunction(
    (from) => document.querySelector('video')?.currentTime > from + 1,
    sought,
    {
      timeout: 60000,
    }
  )
  ctx.check(!(await video()).paused, 'Play works in split screen')
  await page.getByRole('button', { name: 'Exit split screen' }).click()
  await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2)
  await page.waitForFunction(() => !document.querySelector('video')?.paused, null, {
    timeout: 60000,
  })
  await ctx.shot('floating-while-playing')
  ctx.check(!(await video()).paused, 'leaving split screen mid-play keeps the video playing')
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  ctx.noPageErrors()
}
