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
