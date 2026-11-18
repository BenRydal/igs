import type { MediaPort } from 'svelte-p5-components'

let port: MediaPort | null = null

export function attachVideo(next: MediaPort): () => void {
  port = next
  return () => {
    if (port === next) port = null
  }
}

export function seekVideo(time: number): void {
  port?.seek(time)
}

export function videoTime(): number | null {
  return port ? port.currentTime : null
}
