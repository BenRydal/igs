<script lang="ts">
  import { htmlMediaPort, type MediaPort } from 'svelte-p5-components'
  import {
    createYouTubePlayer,
    youTubePort,
    type YouTubePlayerLike,
  } from 'svelte-p5-components/youtube'
  import VideoStore, { setLoaded } from '../../stores/videoStore'
  import { isPlayingVideo } from '../../stores/playbackStore'
  import { timelineV2Store } from '../timeline/store'
  import { attachVideo } from '../video/player'

  let port = $state.raw<MediaPort | null>(null)
  let wasPlaying = false

  let source = $derived($VideoStore.source)
  let videoId = $derived(source.type === 'youtube' ? source.videoId : undefined)

  function ready(next: MediaPort) {
    const time = timelineV2Store.getState().currentTime
    if (time > 0) next.seek(time)
    wasPlaying = false
    port = next
    setLoaded(next.duration)
  }

  function youtubePlayer(container: HTMLElement) {
    if (!videoId) return
    const target = document.createElement('div')
    container.replaceChildren(target)
    let player: YouTubePlayerLike | null = null
    let cancelled = false
    createYouTubePlayer(target, {
      videoId,
      playerVars: {
        controls: 0,
        disablekb: 1,
        playsinline: 1,
        modestbranding: 1,
        rel: 0,
        autoplay: 0,
      },
    }).then(
      (created) => {
        if (cancelled) {
          created.destroy()
          return
        }
        player = created
        ready(youTubePort(created))
      },
      (error: unknown) => console.error('Video player error:', error)
    )
    return () => {
      cancelled = true
      port = null
      player?.destroy()
      target.remove()
    }
  }

  function filePlayer(video: HTMLVideoElement) {
    const loaded = () => ready(htmlMediaPort(video))
    const failed = () => console.error('Video player error: Error loading video file')
    video.addEventListener('loadedmetadata', loaded)
    video.addEventListener('error', failed)
    return () => {
      video.removeEventListener('loadedmetadata', loaded)
      video.removeEventListener('error', failed)
      port = null
    }
  }

  $effect(() => {
    if (!port) return
    return attachVideo(port)
  })

  $effect(() => {
    const playing = $isPlayingVideo
    if (!port) return
    if (playing) port.play()
    else if (wasPlaying) port.pause()
    wasPlaying = playing
  })

  $effect(() => {
    port?.setMuted?.($VideoStore.isMuted)
  })
</script>

<div class="video-player">
  <div
    {@attach youtubePlayer}
    class="youtube-container"
    class:hidden={source.type !== 'youtube'}
  ></div>

  {#if source.type === 'file' && source.fileUrl}
    <video {@attach filePlayer} src={source.fileUrl} playsinline>
      <track kind="captions" />
    </video>
  {/if}
</div>

<style>
  .video-player {
    width: 100%;
    height: 100%;
    background: #000;
  }

  .youtube-container {
    width: 100%;
    height: 100%;
  }

  .youtube-container.hidden {
    display: none;
  }

  .youtube-container :global(iframe) {
    width: 100%;
    height: 100%;
    border: none;
  }

  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>
