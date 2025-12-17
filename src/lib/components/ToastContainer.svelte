<script lang="ts">
  import { fly, fade } from 'svelte/transition'
  import { flip } from 'svelte/animate'
  import { toastStore, type Toast } from '../../stores/toastStore'
  import { Z_INDEX } from '$lib/styles/z-index'

  // Toast type to DaisyUI alert class mapping
  const alertClass: Record<Toast['type'], string> = {
    info: 'alert-info',
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-error',
  }

  // Toast type to icon mapping
  const icons: Record<Toast['type'], string> = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠️',
    error: '✕',
  }
</script>

<div class="toast toast-top toast-end" style:z-index={Z_INDEX.TOAST}>
  {#each $toastStore as toast (toast.id)}
    <div
      class="alert {alertClass[toast.type]} shadow-lg min-w-[300px] max-w-md"
      in:fly={{ x: 100, duration: 200 }}
      out:fade={{ duration: 150 }}
      animate:flip={{ duration: 200 }}
      role="alert"
      aria-live="polite"
    >
      <span class="text-lg">{icons[toast.type]}</span>
      <span class="flex-1">{toast.message}</span>

      {#if toast.action}
        <button
          class="btn btn-sm btn-ghost"
          onclick={() => {
            toast.action?.onClick()
            toastStore.remove(toast.id)
          }}
        >
          {toast.action.label}
        </button>
      {/if}

      <button
        class="btn btn-sm btn-circle btn-ghost"
        onclick={() => toastStore.remove(toast.id)}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  {/each}
</div>

<style>
  .toast {
    pointer-events: none;
  }
  .toast > * {
    pointer-events: auto;
  }
</style>
