# verify-igs

IGS is a single-page SvelteKit app. A user loads an example or imports files, then reads a
p5 WEBGL canvas (floor plan plus space-time paths) alongside side panels, a timeline and an
optional YouTube or MP4 player. This tool starts a private dev server, drives the page with
Playwright, and writes screenshots, accessibility snapshots and a result file. It is plain
Node and works the same for a person at a terminal or any coding agent.

Use it before calling a change done: run the journeys on `main`, run them on the change,
and compare. It has its own `package.json`, so the app's install and CI do not pay for it.

All commands run from the repo root. `V=tools/verify-igs`.

## Launch

```bash
yarn install --immutable
(cd $V && npm install --no-audit --no-fund)
yarn verify launch
```

`launch` starts `vite dev` on `127.0.0.1:5199` (`IGS_VERIFY_PORT` overrides), waits until the
page answers with the IGS title, and prints `ready: <url> pid <n> commit <sha>`. It refuses a
port that already serves IGS from another process. The app needs no env file, database or
login. GPS examples need `VITE_MAPBOX_TOKEN`; the journeys here do not use them.

Playwright 1.64.1 expects Chromium revision 1248 in `~/.cache/ms-playwright`. If it is
missing: `(cd $V && npx playwright install chromium)`.

## Doctor

```bash
yarn verify doctor
```

Read-only. Checks the state file, that the recorded pid is alive, that the app answers, and
that the server was launched at the current `HEAD`. Run it first whenever a result looks
off. A commit mismatch means stop and relaunch; Vite hot-reloads edits, so uncommitted
changes are served and `doctor` reports that the tree is dirty.

## Drive

```bash
yarn verify run all
yarn verify run timeline-playback people-toggle
yarn verify run all --out /abs/path/for/evidence
```

Each journey is one file in `journeys/`, default-exporting `async (ctx) => {}`. The
feature map in `features/` says what each proves. `ctx` (from `lib.mjs`) gives:

| Helper                   | Does                                                                            |
| ------------------------ | ------------------------------------------------------------------------------- |
| `ctx.page`               | the Playwright page, 1440x900, tour suppressed through `localStorage`           |
| `ctx.open(path)`         | go to the app and wait for the canvas                                           |
| `ctx.openPanel(name)`    | select a rail tab: Data, People, Codes, Talk, Filters, Settings, Help           |
| `ctx.loadExample(label)` | filter and load an example dataset by its label                                 |
| `ctx.shot(label)`        | numbered screenshot plus ARIA snapshot                                          |
| `ctx.canvasInk()`        | count of canvas pixels that differ from the background, on a 320x200 downsample |
| `ctx.check(cond, msg)`   | fail the journey with a message                                                 |
| `ctx.noPageErrors()`     | fail on any uncaught page error                                                 |

`lib.mjs` also exports `loadedExample(ctx)` (open, load "Michael Jordan's Last Shot",
dismiss the 3D hint), `clock(page)`, `currentSeconds(page)` and `timelineCanvas(page)`.

To prove a new behaviour, add a journey; do not call store setters or `page.evaluate`
into app internals. Locate by role and accessible name. The handles that exist today:

- Header buttons: `Space-time`, `Video`, `Transcript`.
- Rail: `tab` Data, People, Codes, Talk, Filters, Settings, Help; panels are
  `tabpanel "<Name> panel"`.
- People: `Hide movement for <name>`, `Hide talk for <name>`, `Rename <name>`,
  `Change color for <name>`.
- Timeline bar: `Play`/`Pause`, `Reset`, `Playback speed`, `Zoom in`, `Zoom out`,
  `Fit to view`; the track is `canvas.touch-none`; the clock reads `m:ss / m:ss`.
- Import: `dialog "Import Data"`, one `input[type=file]`, `Import N files`, `Cancel`.
- Command palette: `Control+k`, `combobox "Search commands..."`, `option` rows.

The canvas has no DOM. Prove canvas changes by `canvasInk()` before and after an action,
compared as a ratio, and by the screenshot. Never assert an exact ink number.

## Evidence

A run writes to `$V/artifacts/<UTC timestamp>/` (or `--out`):

- `<journey>/NN-<label>.png` and `.aria.txt` for every step, in order.
- `<journey>/console.log` with the page console and uncaught errors.
- `result.json` with commit, dirty flag, per-journey pass or fail, and the error text.

Proof standards: drive the real control a user would, capture the state before and after
the action, and attach `result.json` plus the step images that show the change. A
before-and-after comparison uses two runs with `--out`, one on `main` and one on the
change. A journey that passes on a build where the behaviour was deliberately broken proves
nothing; when adding a journey, break the behaviour once and watch it fail.

Not observable from this harness: frames inside the YouTube iframe (it loads, but headless
Chromium does not play it, so the clock stays at 0:00 while video is shown), audio, and
GPS map tiles without a Mapbox token. Verify those by hand and say so in the report.

## Cleanup

```bash
yarn verify stop
```

Stops only the process group this harness started, by recorded pid, and removes the state
file. It never touches `artifacts/` or an `--out` directory.

## Helpers

- `verify.mjs`: `launch | doctor | stop | run [journey...|all] [--out <dir>]`.
- `lib.mjs`: the `ctx` helpers above.
- `fixtures/alex.csv`, `fixtures/talk.csv`: a 61-row movement file and a 4-row
  conversation file for the import journey.
