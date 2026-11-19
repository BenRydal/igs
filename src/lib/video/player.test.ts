import { describe, it, expect } from 'vitest'
import type { MediaPort } from 'svelte-p5-components'
import { attachVideo, seekVideo, videoTime } from './player'

function fakePort(start = 0): MediaPort {
  let time = start
  return {
    get currentTime() {
      return time
    },
    duration: 30,
    paused: true,
    ended: false,
    seek(next) {
      time = next
    },
    play() {},
    pause() {},
  }
}

describe('video player port', () => {
  it('has no time and ignores seeks when no video is attached', () => {
    expect(videoTime()).toBeNull()
    expect(() => seekVideo(5)).not.toThrow()
  })

  it('seeks and reads the attached video', () => {
    const detach = attachVideo(fakePort(3))
    expect(videoTime()).toBe(3)
    seekVideo(12)
    expect(videoTime()).toBe(12)
    detach()
    expect(videoTime()).toBeNull()
  })

  it('keeps a newer video attached when an older one detaches late', () => {
    const detachOld = attachVideo(fakePort(1))
    const detachNew = attachVideo(fakePort(8))
    detachOld()
    expect(videoTime()).toBe(8)
    detachNew()
  })
})
