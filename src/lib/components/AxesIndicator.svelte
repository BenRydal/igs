<!--
  Orientation legend for the 3D space-time view.

  Deliberately NOT a projection of the live camera. The sketch's camera has no
  yaw (a single rotateX), so a cube in its true projection collapses — the side
  faces go edge-on and the volume reads as a flat rectangle. This legend adds a
  slight oblique depth axis so the space-time cube reads as a volume: the floor
  plan is the shaded base, and the wireframe above it is that same floor plan
  carried through time.

  Being plain SVG also keeps text out of the WEBGL canvas, where p5 would need a
  loaded font file to draw any.
-->
<script lang="ts">
  import { Z_INDEX } from '$lib/styles/z-index'

  interface Props {
    class?: string
  }

  let { class: className = '' }: Props = $props()
</script>

<div class="axes-indicator {className}" style="z-index: {Z_INDEX.FAB}" aria-hidden="true">
  <svg viewBox="0 0 100 100" role="presentation">
    <circle class="badge" cx="50" cy="50" r="48" />

    <!-- The cube's far face and uprights, carrying the floor plan through time -->
    <polygon class="cube" points="38,32 70,32 58,40 26,40" />
    <line class="cube" x1="70" y1="58" x2="70" y2="32" />
    <line class="cube" x1="58" y1="66" x2="58" y2="40" />
    <line class="cube" x1="26" y1="66" x2="26" y2="40" />

    <!-- The floor plan itself: the cube's base, in x and y -->
    <polygon class="floor" points="38,58 70,58 58,66 26,66" />

    <!-- z: time, the cube's height -->
    <line class="axis axis--time" x1="38" y1="58" x2="38" y2="39" />
    <polygon class="head head--time" points="38,32 34.6,39 41.4,39" />
    <text class="label label--time" x="38" y="22">time</text>

    <!-- x and y: the floor plan's own two dimensions -->
    <line class="axis" x1="38" y1="58" x2="63" y2="58" />
    <polygon class="head" points="70,58 63,54.6 63,61.4" />
    <text class="label" x="78" y="60">x</text>

    <line class="axis" x1="38" y1="58" x2="31.8" y2="62.1" />
    <polygon class="head" points="26,66 29.9,59.3 33.7,64.9" />
    <text class="label" x="17" y="73">y</text>
  </svg>
</div>

<style>
  .axes-indicator {
    position: absolute;
    bottom: 0.75rem;
    left: 0.75rem;
    width: 104px;
    height: 104px;
    /* A legend, never a target - the canvas underneath keeps every event */
    pointer-events: none;
    animation: fade-in 0.25s ease-out;
  }

  svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .badge {
    fill: rgb(255 255 255 / 0.85);
    stroke: rgb(0 0 0 / 0.1);
    stroke-width: 1;
  }

  /* The volume reads as structure, so it stays lighter than the base */
  .cube {
    fill: none;
    stroke: rgb(0 0 0 / 0.16);
    stroke-width: 1;
  }

  .floor {
    fill: rgb(0 0 0 / 0.09);
    stroke: rgb(0 0 0 / 0.2);
    stroke-width: 1;
  }

  .axis {
    stroke: rgb(0 0 0 / 0.6);
    stroke-width: 1.6;
    stroke-linecap: round;
  }

  .head {
    fill: rgb(0 0 0 / 0.6);
  }

  .label {
    fill: rgb(0 0 0 / 0.65);
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 9px;
    text-anchor: middle;
  }

  /* Matches the timeline playhead, tying the axis to the scrubber below */
  .axis--time {
    stroke: #ef4444;
  }

  .head--time {
    fill: #ef4444;
  }

  .label--time {
    fill: #ef4444;
    font-weight: 600;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .axes-indicator {
      animation: none;
    }
  }
</style>
