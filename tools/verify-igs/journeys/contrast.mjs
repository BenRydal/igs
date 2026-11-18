import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { AxeBuilder } from '@axe-core/playwright'
import { loadedExample } from '../lib.mjs'

const PANELS = ['Data', 'People', 'Codes', 'Talk', 'Filters', 'Settings']

function paintedContrast(el) {
  const chain = []
  for (let node = el; node; node = node.parentElement) chain.unshift(node)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const paint = canvas.getContext('2d', { willReadFrequently: true })
  const pixel = () => [...paint.getImageData(0, 0, 1, 1).data].slice(0, 3)
  paint.fillStyle = '#fff'
  paint.fillRect(0, 0, 1, 1)
  let opacity = 1
  for (const node of chain) {
    const style = getComputedStyle(node)
    opacity *= Number(style.opacity)
    paint.fillStyle = style.backgroundColor
    paint.fillRect(0, 0, 1, 1)
  }
  const bg = pixel()
  paint.globalAlpha = opacity
  paint.fillStyle = getComputedStyle(el).color
  paint.fillRect(0, 0, 1, 1)
  const fg = pixel()
  const luminance = (rgb) => {
    const [r, g, b] = rgb.map((v) => {
      const c = v / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
  const style = getComputedStyle(el)
  const px = parseFloat(style.fontSize)
  const large = px >= 24 || (px >= 18.66 && Number(style.fontWeight) >= 700)
  return {
    ratio: Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100,
    needs: large ? 3 : 4.5,
    fg: `rgb(${fg})`,
    bg: `rgb(${bg})`,
    text: el.innerText.replace(/\s+/g, ' ').slice(0, 40),
  }
}

export default async function (ctx) {
  const { page } = ctx
  const failures = []

  const scan = async (state) => {
    const { violations, incomplete } = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze()
    for (const node of incomplete.flatMap((v) => v.nodes)) {
      if (node.any[0]?.data?.messageKey !== 'bgImage') continue
      const measured = await page.locator(node.target[0]).first().evaluate(paintedContrast)
      if (measured.ratio >= measured.needs) continue
      failures.push({
        state,
        text: measured.text,
        ratio: measured.ratio,
        needs: measured.needs,
        fg: measured.fg,
        bg: measured.bg,
        target: node.target[0],
      })
    }
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
