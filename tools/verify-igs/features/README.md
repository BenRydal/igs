# IGS verification map

The maintained source for verifying what a user can do in IGS. Read this index, then the
feature file, before driving the app.

## Baseline preconditions

- `node tools/verify-igs/verify.mjs launch` then `doctor`, both green.
- Each journey starts from a fresh browser context with the onboarding tour suppressed.
- Never drive an instance this harness did not start.

## Features

| Feature                      | File                       | Journeys                                                  |
| ---------------------------- | -------------------------- | --------------------------------------------------------- |
| Load and clear data          | [data.md](data.md)         | `example-load`, `import-csv`, `clear-data`                |
| People and visibility        | [people.md](people.md)     | `people-toggle`                                           |
| Space-time view              | [view.md](view.md)         | `view-2d-3d`, `workspace-actions`                         |
| Timeline and playback        | [timeline.md](timeline.md) | `timeline-playback`                                       |
| Text contrast                | [contrast.md](contrast.md) | `contrast`                                                |
| Video                        | [video.md](video.md)       | `video-toggle`                                            |
| Commands, shortcuts and undo | [commands.md](commands.md) | `command-palette-undo`, `workspace-actions`, `clear-data` |

## Not yet mapped

Codes panel, Talk panel, selection tools (circle, slice, highlight), transcript window,
split-screen video, GPS examples and map styles, floor plan rotation, data explorer,
rename and recolor a person, settings sliders, the
`/guide` page. A change to any of these needs a new journey and a new file here first.

## Proof and skip reporting

- Capture the action and the resulting state, not only the final screen.
- Canvas proof is an ink ratio plus the screenshot pair.
- Report an unreachable path with the journey name and the unmet precondition.
