# Space-time view

The canvas shows the floor plan flat (2D) or as a space-time cube with time on the
vertical axis (3D, the default).

## Sub-features

- `view-toggle` switches 3D and 2D from the header and from the `D` key.

## How to get to it (user POV)

- Press `Space-time` in the header, or press `D` with focus outside a text field.

## Driving it with verify-igs

- **Toggle.** `node $V/verify.mjs run view-2d-3d`. Ink changes by more than 10 percent
  going to 2D and returns to within 10 percent of the 3D value after `D`.

## Gotchas

- The transition animates; the journey waits 1.5 s before measuring.
- A one-time `Understanding the 3D View` card covers part of the canvas until `Got it`.
- Not covered: floor plan rotation, the axes indicator, canvas rotation by drag.
