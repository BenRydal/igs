# Timeline and playback

The bottom bar animates the data through time and lets a user seek and zoom the time
range the canvas shows.

## Sub-features

- `timeline-play` plays and pauses the animation.
- `timeline-seek` seeks by clicking the track.
- `timeline-zoom` zooms with the buttons and by dragging a region; `Fit to view` resets.
  Large zoom changes ease in; the clock total stays the recording length.
- `timeline-overview` is the thin strip under the track. It always spans the whole
  recording; when zoomed it shows a window that can be dragged to pan.
- `timeline-reset` returns to the start.

## How to get to it (user POV)

- `Play`, `Reset`, `Zoom in`, `Zoom out`, `Fit to view` in the bottom bar; click or drag
  on the track to the right of the clock.

## Driving it with verify-igs

- **All four.** `node $V/verify.mjs run timeline-playback`. The clock leaves `0:00` after
  Play and holds after Pause; a click at 75 percent of the track lands between 26 s and
  30 s of 37; `Fit to view` is disabled until zoomed, enabled after `Zoom in` and after a
  drag across 20 to 60 percent of the track; the overview window is wider mid-zoom than
  settled, and dragging it 80 px pans the view; `Reset` returns the clock to `0:00`.

## Gotchas

- Playback is slow in headless software rendering; the journey waits up to 60 s for the
  first second to elapse.
- The clock's text nodes are separated by newlines; compare through `clock(page)`.
- With the video shown, the YouTube player drives time and does not play headless.
- The track is `.igs-timeline-main .timeline-track` (`timelineTrack(page)`); the overview
  window is `overviewWindow(page)` and exists only while zoomed.
- Zoom animates for 280 ms; wait 500 ms before reading a settled view.
- Not covered: playback speed, wheel zoom, alt-drag pan, hover time, keyboard zoom, the
  activity gradient.
