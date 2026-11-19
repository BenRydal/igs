# Timeline

The timeline is `svelte-p5-components`' `TimelineTrack`, skinned for IGS in
`components/Timeline.svelte`. The library owns the interaction: seek, playhead
drag, drag-to-zoom, wheel zoom and pan, keyboard, and hover time. IGS owns what
the track means.

| Piece                       | Where                        | What it does                                                                                                                                        |
| --------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| View and playhead state     | `store.ts`                   | Single source of truth. The sketch reads `leftX`/`rightX` and the view window from it every frame, so the track doubles as the 2D view's time axis. |
| Animated zoom               | `view-animation.ts`          | Large view changes (zoom buttons, a dragged region, fit) ease over 280 ms. Small ones (wheel, pan) apply at once. Honors reduced-motion.            |
| Activity gradient           | `activity-gradient.ts`       | Buckets movement speed across the recording and returns a CSS gradient drawn under the track.                                                       |
| Tick labels and time format | `utils.ts`                   | Grid interval and label math.                                                                                                                       |
| Overview strip              | `components/Timeline.svelte` | A second, thin track that always spans the whole recording. When zoomed, its window shows where the view sits and can be dragged.                   |

## History

Before January 2026 the timeline was a range slider. It was replaced by a custom
canvas timeline (#134) for zoom, hover and a robust playhead. In July 2026 the
library's track was evaluated and rejected because it had no zoomable view
window, no pixel-bounds export and no custom layer under the track. The library
has since gained all three (`viewStart`/`viewEnd`/`zoomable`, `onBoundsChange`,
the `underlay` snippet), so the canvas renderer and its layers were removed in
November 2026.
