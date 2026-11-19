# People and visibility

Each person in the data has a row in the People panel with toggles for their movement
path and their talk.

## Sub-features

- `people-hide-movement` hides and shows one person's path on the canvas.

## How to get to it (user POV)

- Open the People tab; press the walking icon beside a name.

## Driving it with verify-igs

- **Hide and show.** `node $V/verify.mjs run people-toggle`. `Hide movement for jordan`
  becomes `Show movement for jordan`, canvas ink drops by more than 20 percent, and
  toggling back restores it to within 5 percent.

## Gotchas

- Names are lowercased from file names and speaker values.
- Not covered: hide talk, hide a whole person, rename, recolor.
