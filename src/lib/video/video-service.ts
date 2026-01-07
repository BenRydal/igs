/**
 * VideoService - Stateless operations for video playback
 * Works with both YouTube IFrame API players and HTML5 video elements
 */

// YouTube player type (from IFrame API)
interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead?: boolean): void
  getCurrentTime(): number
  getDuration(): number
  mute(): void
  unMute(): void
  isMuted(): boolean
  destroy(): void
  getIframe(): HTMLIFrameElement | null
}

// Union type for supported player types
export type VideoPlayer = YTPlayer | HTMLVideoElement

let youtubeApiLoaded = false
let youtubeApiLoading = false
const youtubeApiCallbacks: (() => void)[] = []

/**
 * Load YouTube IFrame API script dynamically
 */
export function loadYouTubeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (youtubeApiLoaded) {
      resolve()
      return
    }

    youtubeApiCallbacks.push(resolve)

    if (youtubeApiLoading) {
      return
    }

    youtubeApiLoading = true

    // Check if API is already available (script might be in HTML)
    if (typeof window !== 'undefined' && (window as any).YT && (window as any).YT.Player) {
      youtubeApiLoaded = true
      youtubeApiCallbacks.forEach((cb) => cb())
      youtubeApiCallbacks.length = 0
      return
    }

    // Set up callback before loading script
    ;(window as any).onYouTubeIframeAPIReady = () => {
      youtubeApiLoaded = true
      youtubeApiCallbacks.forEach((cb) => cb())
      youtubeApiCallbacks.length = 0
    }

    // Load the script
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    document.head.appendChild(script)
  })
}

/**
 * Create a YouTube player in the specified container
 */
export function createYouTubePlayer(
  containerId: string,
  videoId: string,
  onReady: (player: YTPlayer, duration: number) => void,
  onError?: (error: any) => void
): void {
  loadYouTubeApi().then(() => {
    const YT = (window as any).YT
    new YT.Player(containerId, {
      videoId,
      playerVars: {
        controls: 0,
        disablekb: 1,
        playsinline: 1,
        modestbranding: 1,
        rel: 0,
        autoplay: 0,
      },
      events: {
        onReady: (event: any) => {
          const player = event.target as YTPlayer
          const duration = player.getDuration()
          onReady(player, duration)
        },
        onError: (event: any) => {
          console.error('YouTube player error:', event.data)
          onError?.(event.data)
        },
      },
    })
  })
}

/**
 * Type guard to check if player is YouTube player
 */
function isYouTubePlayer(player: VideoPlayer): player is YTPlayer {
  return typeof (player as YTPlayer).playVideo === 'function'
}

/**
 * Check if a YouTube player is still attached to the DOM and usable
 */
function isYouTubePlayerReady(player: YTPlayer): boolean {
  try {
    const iframe = player.getIframe()
    return iframe !== null && iframe.isConnected
  } catch {
    return false
  }
}

/**
 * Playback operations - work with both YouTube and HTML5 players
 * YouTube API methods are wrapped in try-catch because the iframe may not be fully ready
 */
export function playVideo(player: VideoPlayer): void {
  if (!player) return
  try {
    if (isYouTubePlayer(player)) {
      if (!isYouTubePlayerReady(player)) {
        console.warn('playVideo: YouTube player not ready')
        return
      }
      player.playVideo()
    } else {
      player.play()
    }
  } catch (e) {
    console.warn('playVideo failed:', e)
  }
}

export function pauseVideo(player: VideoPlayer): void {
  if (!player) return
  try {
    if (isYouTubePlayer(player)) {
      if (!isYouTubePlayerReady(player)) {
        console.warn('pauseVideo: YouTube player not ready')
        return
      }
      player.pauseVideo()
    } else {
      player.pause()
    }
  } catch (e) {
    console.warn('pauseVideo failed:', e)
  }
}

export function seekTo(player: VideoPlayer, time: number): void {
  if (!player) return
  try {
    if (isYouTubePlayer(player)) {
      if (!isYouTubePlayerReady(player)) {
        console.warn('seekTo: YouTube player not ready')
        return
      }
      player.seekTo(time, true)
    } else {
      player.currentTime = time
    }
  } catch (e) {
    console.warn('seekTo failed:', e)
  }
}

export function getCurrentTime(player: VideoPlayer): number {
  if (!player) return 0
  try {
    if (isYouTubePlayer(player)) {
      if (!isYouTubePlayerReady(player)) return 0
      return player.getCurrentTime()
    } else {
      return player.currentTime
    }
  } catch {
    return 0
  }
}

export function getDuration(player: VideoPlayer): number {
  if (!player) return 0
  try {
    if (isYouTubePlayer(player)) {
      if (!isYouTubePlayerReady(player)) return 0
      return player.getDuration()
    } else {
      return player.duration
    }
  } catch {
    return 0
  }
}

export function muteVideo(player: VideoPlayer): void {
  if (!player) return
  try {
    if (isYouTubePlayer(player)) {
      if (!isYouTubePlayerReady(player)) {
        console.warn('muteVideo: YouTube player not ready')
        return
      }
      player.mute()
    } else {
      player.muted = true
    }
  } catch (e) {
    console.warn('muteVideo failed:', e)
  }
}

export function unmuteVideo(player: VideoPlayer): void {
  if (!player) return
  try {
    if (isYouTubePlayer(player)) {
      if (!isYouTubePlayerReady(player)) {
        console.warn('unmuteVideo: YouTube player not ready')
        return
      }
      player.unMute()
    } else {
      player.muted = false
    }
  } catch (e) {
    console.warn('unmuteVideo failed:', e)
  }
}

export function destroyPlayer(player: VideoPlayer): void {
  if (!player) return
  try {
    if (isYouTubePlayer(player)) {
      player.destroy()
    }
  } catch (e) {
    console.warn('destroyPlayer failed:', e)
  }
  // HTML5 video elements are cleaned up when removed from DOM
}

/**
 * Parse a YouTube URL and extract the video ID
 * Supports various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * @returns The video ID or null if the URL is not a valid YouTube URL
 */
export function parseYouTubeUrl(url: string): string | null {
  if (!url) return null

  // Clean up the URL
  const trimmedUrl = url.trim()

  // YouTube video IDs are 11 characters, alphanumeric with - and _
  const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/

  // If it's already just a video ID, return it
  if (videoIdPattern.test(trimmedUrl)) {
    return trimmedUrl
  }

  try {
    const urlObj = new URL(trimmedUrl)
    const hostname = urlObj.hostname.replace('www.', '')

    // youtu.be/VIDEO_ID
    if (hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1).split('/')[0]
      if (videoIdPattern.test(videoId)) {
        return videoId
      }
    }

    // youtube.com formats
    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      // /watch?v=VIDEO_ID
      const vParam = urlObj.searchParams.get('v')
      if (vParam && videoIdPattern.test(vParam)) {
        return vParam
      }

      // /embed/VIDEO_ID or /v/VIDEO_ID
      const pathMatch = urlObj.pathname.match(/^\/(embed|v)\/([a-zA-Z0-9_-]{11})/)
      if (pathMatch) {
        return pathMatch[2]
      }
    }
  } catch {
    // Invalid URL, return null
  }

  return null
}
