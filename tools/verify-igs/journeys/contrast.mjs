import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { AxeBuilder } from '@axe-core/playwright'
import { loadedExample } from '../lib.mjs'

const PANELS = ['Data', 'People', 'Codes', 'Talk', 'Filters', 'Settings']

export default async function (ctx) {
  const { page } = ctx
  const failures = []

  const scan = async (state) => {
    const { violations } = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()
    for (const node of violations.flatMap((v) => v.nodes)) {
      const d = node.any[0]?.data ?? {}
      failures.push({
        state,
        text: (
          await page
            .locator(node.target[0])
            .first()
            .innerText()
            .catch(() => '')
        )
          .replace(/\s+/g, ' ')
          .slice(0, 40),
        ratio: d.contrastRatio,
        needs: d.expectedContrastRatio,
        fg: d.fgColor,
        bg: d.bgColor,
        size: d.fontSize,
        target: node.target[0],
      })
    }
  }

  await ctx.open('/')
  await scan('empty app')
  await loadedExample(ctx)
  for (const panel of PANELS) {
    await ctx.openPanel(panel)
    await scan(`${panel} panel`)
  }
  await page.getByRole('button', { name: 'Close panel' }).click()
  await page.getByRole('button', { name: 'Zoom in' }).click()
  await page.waitForTimeout(500)
  await scan('zoomed timeline')
  await page.getByRole('button', { name: 'Transcript', exact: true }).click()
  await page.waitForTimeout(500)
  await scan('transcript open')
  await page.getByRole('button', { name: 'Transcript', exact: true }).click()

  await ctx.openPanel('Data')
  await page.getByRole('button', { name: 'Import files' }).click()
  const dialog = page.getByRole('dialog', { name: 'Import Data' })
  await dialog.waitFor()
  await dialog.evaluate((el) =>
    Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished))
  )
  await scan('import dialog')
  await page.keyboard.press('Escape')

  await page.goto(ctx.base + '/guide', { waitUntil: 'networkidle' })
  await scan('guide page')

  writeFileSync(join(ctx.outDir, 'contrast.json'), JSON.stringify(failures, null, 2))
  await ctx.shot('guide')
  const worst = [...failures].sort((a, b) => a.ratio - b.ratio)[0]
  ctx.check(
    failures.length === 0,
    `${failures.length} text elements below WCAG AA contrast; worst ${worst?.ratio}:1 "${worst?.text}" in ${worst?.state}`
  )
  ctx.noPageErrors()
}
