# Load and clear data

A user gets data into IGS by picking a bundled example or importing files, sees what is
loaded in the Data panel, and can clear it.

## Sub-features

- `data-example` loads a bundled example and lists Movement, Conversation, Codes, Video.
- `data-import` imports CSV files through the Import Data dialog.
- `data-clear-all` empties everything and restores the empty state.

## How to get to it (user POV)

- Open the Data tab in the left rail; type in `Filter examples` and choose an example.
- Choose `Import files`, pick files, then `Import N files`.
- Choose `Clear all` in the Data panel.

## Driving it with verify-igs

- **Example.** `node $V/verify.mjs run example-load`. The Data panel shows `2 people`,
  `1 speaker`, `3 codes`, `YouTube`; the clock reads `0:00 / 0:37`; canvas ink rises more
  than fivefold over the empty canvas.
- **Import.** `node $V/verify.mjs run import-csv`. `alex.csv` and `talk.csv` are listed in
  the dialog; after import the People panel has `alex` (named from the file) and `sam` (a
  speaker with no movement file).
- **Clear.** The last step of `example-load` chooses `Clear all` and waits for
  `Nothing loaded yet`.
- **Clear each kind.** `node $V/verify.mjs run clear-data`. `Clear conversation`, `Clear codes`
  and `Clear movement` in the Data panel each remove their count (the Codes tab leaves with
  the codes, canvas ink drops by more than 20 percent). Then the palette loads the example
  (`Load: Michael Jordan's Last Shot`), clears each kind, reloads, and `Clear All Data`
  restores `Nothing loaded yet`.

## Gotchas

- The import button's name includes the count: `Import 2 files`. With no files it is
  `Import` and disabled.
- Escape does not close the Import Data dialog on `main` at `13a0489`; use `Cancel`.
- Imported movement without a floor plan image still lists the person; do not assert ink.
- Not covered: GPX, KML, floor plan images, MP4, the YouTube URL box, the video clear button,
  `Clear existing data before import`.
