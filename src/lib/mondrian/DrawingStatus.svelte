<script lang="ts">
  import floorplanStore from '../../stores/floorplanStore'
  import { appMode, recorder } from './session'

  const message = $derived.by(() => {
    if (!$floorplanStore) return 'Load a floorplan to start drawing'
    if (!$recorder.drawAs) return 'Choose a person to draw as'
    if ($recorder.recording) return `Recording ${$recorder.drawAs} · click to stop`
    return `Click the floorplan to record ${$recorder.drawAs}`
  })
</script>

{#if $appMode === 'mondrian'}
  <div class="drawing-status" class:recording={$recorder.recording} role="status">
    {#if $recorder.recording}<span class="dot" aria-hidden="true"></span>{/if}
    {message}
  </div>
{/if}

<style>
  .drawing-status {
    position: absolute;
    top: 0.75rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.8125rem;
    background: color-mix(in srgb, var(--color-base-100) 92%, transparent);
    border: 1px solid var(--color-base-300);
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.08);
    pointer-events: none;
    white-space: nowrap;
  }

  .drawing-status.recording {
    border-color: var(--color-error);
    color: var(--color-error);
  }

  .dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 9999px;
    background: var(--color-error);
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    50% {
      opacity: 0.3;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dot {
      animation: none;
    }
  }
</style>
