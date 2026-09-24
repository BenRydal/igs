<script lang="ts">
  import type p5 from 'p5'
  import { get } from 'svelte/store'
  import { P5Canvas, type SketchFn } from 'svelte-p5'
  import { drawingState } from '../mondrian-tool/stores/drawingState'
  import { drawingConfig } from '../mondrian-tool/stores/drawingConfig'

  let { active = true, class: className = '' }: { active?: boolean; class?: string } = $props()

  let container = $state<HTMLDivElement>()
  let instance = $state<p5 | null>(null)

  const MARKER_SIZE = 10

  const sketch: SketchFn = (p) => {
    const size = () => ({
      w: Math.max(1, container?.clientWidth ?? 1),
      h: Math.max(1, container?.clientHeight ?? 1),
    })

    p.setup = () => {
      const { w, h } = size()
      p.createCanvas(w, h, p.WEBGL)
      p.frameRate(30)
    }

    p.draw = () => {
      p.background(255)
      const state = get(drawingState)
      const img = state.imageElement
      if (!img || !state.imageWidth || !state.imageHeight) return

      const footprint = Math.min(p.width, p.height) * 0.55
      const aspect = state.imageWidth / state.imageHeight
      const fw = aspect >= 1 ? footprint : footprint * aspect
      const fh = aspect >= 1 ? footprint / aspect : footprint
      const height = footprint * 0.9

      p.rotateX(p.PI / 3)
      p.rotateZ(p.frameCount * 0.004)
      p.translate(0, 0, -height / 2)
      p.rotateZ(p.radians(get(drawingConfig).floorPlanRotation))

      p.push()
      p.noStroke()
      p.texture(img)
      p.plane(fw, fh)
      p.pop()

      const paths = state.paths.filter((path) => path.visible !== false && path.points.length > 0)
      const times = paths.flatMap((path) => path.points.map((pt) => pt.time))
      const tMin = Math.min(...times)
      const range = Math.max(...times) - tMin || 1
      const at = (pt: { x: number; y: number; time: number }): [number, number, number] => [
        (pt.x / state.imageWidth - 0.5) * fw,
        (pt.y / state.imageHeight - 0.5) * fh,
        ((pt.time - tMin) / range) * height,
      ]

      const pulse = (Math.sin(p.frameCount * 0.1) + 1) * 0.25 + 0.5
      for (const path of paths) {
        p.noFill()
        p.stroke(path.color)
        p.strokeWeight(2)
        p.beginShape()
        for (const pt of path.points) p.vertex(...at(pt))
        p.endShape()

        const [x, y, z] = at(path.points[path.points.length - 1])
        const faint = p.color(path.color)
        faint.setAlpha(70)
        p.stroke(faint)
        p.strokeWeight(1)
        p.line(x, y, 0, x, y, z)

        p.push()
        p.translate(x, y, z)
        p.noStroke()
        faint.setAlpha(60)
        p.fill(faint)
        p.sphere(MARKER_SIZE * pulse, 12, 8)
        p.fill(path.color)
        p.sphere(MARKER_SIZE * 0.45 * pulse, 12, 8)
        p.pop()
      }
    }
  }

  $effect(() => {
    if (!container || !instance) return
    const p = instance
    const observer = new ResizeObserver(() => {
      p.resizeCanvas(Math.max(1, container!.clientWidth), Math.max(1, container!.clientHeight))
    })
    observer.observe(container)
    return () => observer.disconnect()
  })

  $effect(() => {
    if (!instance) return
    if (active) instance.loop()
    else instance.noLoop()
  })
</script>

<div class="space-time {className}" bind:this={container}>
  <P5Canvas {sketch} bind:instance />
  <div class="space-time__label">
    <span class="font-semibold">Space-time</span>
    <span class="opacity-60">time rises as you draw</span>
  </div>
</div>

<style>
  .space-time {
    position: relative;
    min-height: 0;
    overflow: hidden;
    border-left: 1px solid var(--color-base-300);
    background: #fff;
  }

  .space-time__label {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    display: flex;
    gap: 0.5rem;
    font-size: 0.75rem;
    pointer-events: none;
  }
</style>
