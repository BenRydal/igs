# Video

A dataset can carry a YouTube video or an MP4 that plays in sync with the timeline, in a
floating window or split-screen.

## Sub-features

- `video-show-hide` shows and hides the player for the loaded dataset.
- `video-file-sync` keeps a local video file in step with the timeline: play, pause, seek,
  mute, and position, play state and mute across a split-screen remount.

## How to get to it (user POV)

- Press `Video` in the header after loading a dataset that has video.

## Driving it with verify-igs

- **Show and hide.** `node $V/verify.mjs run video-toggle`. An iframe for
  `youtube.com/embed/iiMjfVOj8po` becomes visible, then is no longer visible after a
  second press.

- **Local file sync.** `node $V/verify.mjs run video-file`. Imports `fixtures/clip.mp4` (30 s,
  AV1 with audio) with `fixtures/alex.csv` and reads the `<video>` element's `currentTime`,
  `paused` and `muted` after each action.

## Gotchas

- Needs network access to YouTube.
- Headless Chromium does not play the YouTube video, so YouTube sync, seek, mute and remount
  behaviour cannot be proven here; `video-file` proves the same paths for a local file only. Before a change to the video layer ships, a person checks: play,
  toggle split-screen on and off, confirm position, play state and mute survive; repeat
  paused and muted; hide the video mid-play and confirm the animation continues without a
  time jump.
- Not covered: the floating window's drag and resize.
