import { chromium } from 'playwright'
import { readFileSync, readdirSync } from 'node:fs'
const [a, b] = process.argv.slice(2)
const br = await chromium.launch()
const p = await br.newPage()
for (const j of readdirSync(a)) {
  let files
  try {
    files = readdirSync(`${a}/${j}`).filter((f) => f.endsWith('.png'))
  } catch {
    continue
  }
  for (const f of files) {
    let x, y
    try {
      x = readFileSync(`${a}/${j}/${f}`).toString('base64')
      y = readFileSync(`${b}/${j}/${f}`).toString('base64')
    } catch {
      continue
    }
    const r = await p.evaluate(
      async ([x, y]) => {
        const load = async (s) => {
          const i = new Image()
          i.src = 'data:image/png;base64,' + s
          await i.decode()
          const c = document.createElement('canvas')
          c.width = i.width
          c.height = i.height
          const g = c.getContext('2d')
          g.drawImage(i, 0, 0)
          return g.getImageData(0, 0, i.width, i.height)
        }
        const A = await load(x),
          B = await load(y)
        if (A.width !== B.width || A.height !== B.height) return 'size differs'
        let d = 0,
          inkA = 0,
          inkB = 0
        for (let i = 0; i < A.data.length; i += 4) {
          const da =
            Math.abs(A.data[i] - B.data[i]) +
            Math.abs(A.data[i + 1] - B.data[i + 1]) +
            Math.abs(A.data[i + 2] - B.data[i + 2])
          if (da > 40) d++
          const py = Math.floor(i / 4 / A.width)
          if (py > 64 && py < 830) {
            if (A.data[i] + A.data[i + 1] + A.data[i + 2] < 600) inkA++
            if (B.data[i] + B.data[i + 1] + B.data[i + 2] < 600) inkB++
          }
        }
        return `${((d / (A.data.length / 4)) * 100).toFixed(2)}% differ, ink ${inkA} vs ${inkB}`
      },
      [x, y]
    )
    console.log(`${j}/${f}: ${r}`)
  }
}
await br.close()
