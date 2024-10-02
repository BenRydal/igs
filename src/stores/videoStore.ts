import { writable } from 'svelte/store';

const VideoStore = writable({
  isShowing: false,
  isPlaying: false,
});

export default VideoStore;