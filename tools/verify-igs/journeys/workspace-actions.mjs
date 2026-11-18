import { loadedExample, runCommand } from '../lib.mjs'

export default async function (ctx) {
  const { page } = ctx
  await loadedExample(ctx)
  const threeD = await ctx.canvasInk()
  const selectTab = page.getByRole('tab', { name: 'Select', exact: true })
  ctx.check(!(await selectTab.isVisible()), 'Select tab is hidden in 3D')

  await runCommand(page, '2d/3d', /Toggle 2D\/3D View/)
  await page.waitForTimeout(1500)
  const twoD = await ctx.canvasInk()
  await ctx.shot('2d-via-palette')
  ctx.check(
    Math.abs(twoD - threeD) > threeD * 0.1,
    `palette switched to 2D (ink ${threeD} -> ${twoD})`
  )
  ctx.check(await selectTab.isVisible(), 'Select tab appears in 2D')

  await page.keyboard.press('d')
  await page.waitForTimeout(1500)
  const back = await ctx.canvasInk()
  await ctx.shot('3d-via-D-key')
  ctx.check(Math.abs(back - threeD) < threeD * 0.1, `D returned to 3D (ink ${threeD} -> ${back})`)
  ctx.check(!(await selectTab.isVisible()), 'Select tab hides again in 3D')

  const startSlicing = page.getByRole('button', { name: 'Start Slicing' })
  await page.keyboard.press('h')
  await startSlicing.waitFor()
  await ctx.shot('help-open-via-H')
  await page.keyboard.press('h')
  await startSlicing.waitFor({ state: 'hidden' })
  await runCommand(page, 'open help', /Open Help/)
  await startSlicing.waitFor()
  await ctx.shot('help-open-via-palette')
  await startSlicing.click()
  await startSlicing.waitFor({ state: 'hidden' })

  await page.getByRole('tab', { name: 'Help', exact: true }).click()
  await page.getByRole('button', { name: 'Take a Tour' }).click()
  await page.getByText('Welcome to the IGS!').waitFor()
  await page.getByRole('button', { name: /Next/ }).click()
  await page.getByText('Try Example Data').waitFor()
  const dataTab = page.getByRole('tab', { name: 'Data', exact: true })
  await page.getByRole('tabpanel', { name: 'Data panel' }).waitFor()
  await ctx.shot('tour-opened-data-panel')
  ctx.check((await dataTab.getAttribute('aria-selected')) === 'true', 'tour selected Data')
  await page.locator('.driver-popover-close-btn').click()
  await page.getByText('Try Example Data').waitFor({ state: 'hidden' })
  await ctx.shot('tour-closed-panel')
  ctx.check((await dataTab.getAttribute('aria-selected')) !== 'true', 'closing the tour closed it')

  await ctx.openPanel('Settings')
  await page.getByRole('button', { name: 'Keyboard shortcuts' }).click()
  const sheet = page.getByRole('dialog', { name: 'Keyboard Shortcuts' })
  await sheet.waitFor()
  await ctx.shot('cheatsheet')
  for (const text of ['PLAYBACK', 'VIEW', 'SELECTION', 'NAVIGATION', 'DATA', 'MODAL']) {
    ctx.check(await sheet.getByText(text, { exact: true }).isVisible(), `group ${text} listed`)
  }
  for (const text of ['Undo', 'Speed Up', 'Toggle 2D/3D View', 'Download Codes']) {
    ctx.check(await sheet.getByText(text, { exact: true }).first().isVisible(), `"${text}" listed`)
  }
  await sheet.getByRole('button', { name: 'Close keyboard shortcuts' }).click()
  await sheet.waitFor({ state: 'hidden' })
  ctx.noPageErrors()
}
