# Timeline: evaluation vs svelte-p5-components (July 2026)

As part of the svelte-p5 migration, this custom native-canvas timeline was
evaluated against the library's `TimelineScrubber`/`TimelineTrack` and the
`createMediaSync`/`createMediaPlayback` helpers. **Decision: keep the custom
timeline and the custom video sync.** Rationale below so the question doesn't
get re-litigated from scratch.

## Why TimelineScrubber/TimelineTrack don't fit (yet)

| IGS timeline feature | In the library? |
| --- | --- |
| Playhead + seek + hover time | Yes |
| Selection window | Yes |
| **Zoomable view window** (drag-to-zoom region, pan, zoom-to-fit, min duration) | No — the library track always spans the full duration |
| **View window as the visualization's x-axis domain** (`viewPixelToPixel`, `getViewStart/EndPixel` consumed by the sketch every frame) | No — no view-window state, no pixel-bounds export |
| Activity-gradient layer (data-density rendering) | No — `segments` are flat tinted bands; no custom render-layer API |
| Custom canvas layers (background/hover/playhead/zoom-selection) with DPR handling | No — DOM-rendered |

The zoomable view window doubling as the space-time visualization's x-axis
domain is IGS's core interaction; without a view-window/zoom-domain contract
in the library there is nothing to migrate onto. That gap is filed upstream
in svelte-p5's `docs/proposals/igs-port-roadmap.md` (item 2); revisit this
decision if the library ships it.

## Why createMediaSync/createMediaPlayback don't fit

The library helpers attach to an `HTMLMediaElement`. IGS's video backend is
`VideoPlayer = YTPlayer | HTMLVideoElement` (`src/lib/video/video-service.ts`)
— every example dataset uses the YouTube iframe API, which is not a media
element. Adopting the helpers would cover only local-file video and leave a
second, parallel sync path for YouTube; that's more code, not less.

## What the timeline does share with the migration

- The sketch reads this store's viewport-pixel bounds (`leftX`/`rightX`) and
  converts to canvas coordinates via `p5.canvasLeft` — see the coordinate
  notes in `src/lib/p5/igsSketch.ts`.
- The pure math in `utils.ts` (zoom/pan/time↔pixel/grid) is pinned by
  characterization tests in `utils.test.ts`.
