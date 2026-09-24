export interface SamplerOptions {
  /** Seconds between samples while moving (or always, when not adaptive). */
  activeInterval: number
  /** Seconds between samples while stationary; adaptive only. */
  heartbeatInterval: number
  /** Floorplan-pixel distance that counts as moving; adaptive only. */
  minMovement: number
  adaptive: boolean
}

/** Mondrian Transcription's defaults, so recordings keep the same density. */
export const DEFAULT_SAMPLER_OPTIONS: SamplerOptions = {
  activeInterval: 0.004,
  heartbeatInterval: 0.5,
  minMovement: 2,
  adaptive: true,
}

export interface Sampler {
  /** True when a pointer position at `time` should become a recorded point. */
  accept(time: number, x: number, y: number): boolean
  /** Forget the last sample, so the next position is always accepted. */
  reset(): void
}

export function createSampler(options: SamplerOptions = DEFAULT_SAMPLER_OPTIONS): Sampler {
  let last: { time: number; x: number; y: number } | null = null

  return {
    accept(time, x, y) {
      if (last && time < last.time) last = null
      if (last) {
        const moving = Math.hypot(x - last.x, y - last.y) >= options.minMovement
        const interval =
          options.adaptive && !moving ? options.heartbeatInterval : options.activeInterval
        if (time - last.time < interval) return false
      }
      last = { time, x, y }
      return true
    },
    reset() {
      last = null
    },
  }
}
