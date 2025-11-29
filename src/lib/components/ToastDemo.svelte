<script lang="ts">
  import { toastStore, showToast } from '../../stores/toastStore'

  let itemDeleted = $state(false)

  function restoreItem() {
    itemDeleted = false
    toastStore.success('Item restored')
  }

  function deleteItem() {
    itemDeleted = true
    showToast('Item deleted', 'info', {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: restoreItem,
      },
    })
  }

  function simulateError() {
    toastStore.error('Failed to save file', {
      duration: 0,
      action: {
        label: 'Retry',
        onClick: () => toastStore.info('Retrying...'),
      },
    })
  }

  function simulateUpload() {
    const toastId = showToast('Uploading...', 'info', { duration: 0 })

    setTimeout(() => {
      toastStore.remove(toastId)
      toastStore.success('Upload complete')
    }, 2000)
  }
</script>

<div class="p-8 space-y-4">
  <h2 class="text-2xl font-bold">Toast Notification Demo</h2>

  <div class="card bg-base-200 shadow-xl">
    <div class="card-body">
      <h3 class="card-title">Basic Toasts</h3>
      <div class="flex flex-wrap gap-2">
        <button class="btn btn-info" onclick={() => toastStore.info('This is an info message')}>
          Info Toast
        </button>
        <button class="btn btn-success" onclick={() => toastStore.success('Operation successful!')}>
          Success Toast
        </button>
        <button
          class="btn btn-warning"
          onclick={() => toastStore.warning('Warning: Low disk space')}
        >
          Warning Toast
        </button>
        <button class="btn btn-error" onclick={() => toastStore.error('Error occurred!')}>
          Error Toast
        </button>
      </div>
    </div>
  </div>

  <div class="card bg-base-200 shadow-xl">
    <div class="card-body">
      <h3 class="card-title">Duration Examples</h3>
      <div class="flex flex-wrap gap-2">
        <button
          class="btn btn-primary"
          onclick={() => showToast('Quick message (1s)', 'info', { duration: 1000 })}
        >
          1 Second
        </button>
        <button class="btn btn-primary" onclick={() => showToast('Default (3s)', 'info')}>
          3 Seconds (Default)
        </button>
        <button
          class="btn btn-primary"
          onclick={() => showToast('Long message (10s)', 'info', { duration: 10000 })}
        >
          10 Seconds
        </button>
        <button
          class="btn btn-primary"
          onclick={() =>
            showToast('Persistent toast (dismiss manually)', 'warning', { duration: 0 })}
        >
          Persistent
        </button>
      </div>
    </div>
  </div>

  <div class="card bg-base-200 shadow-xl">
    <div class="card-body">
      <h3 class="card-title">Action Buttons</h3>
      <div class="flex flex-wrap gap-2">
        <button class="btn btn-secondary" onclick={deleteItem} disabled={itemDeleted}>
          Delete Item (with Undo)
        </button>
        <button class="btn btn-error" onclick={simulateError}> Error with Retry </button>
        <button class="btn btn-accent" onclick={simulateUpload}> Simulate Upload </button>
      </div>
    </div>
  </div>

  <div class="card bg-base-200 shadow-xl">
    <div class="card-body">
      <h3 class="card-title">Stress Test</h3>
      <div class="flex flex-wrap gap-2">
        <button
          class="btn btn-neutral"
          onclick={() => {
            for (let i = 1; i <= 3; i++) {
              setTimeout(() => toastStore.info(`Toast ${i} of 3`), i * 500)
            }
          }}
        >
          Show 3 Toasts
        </button>
        <button
          class="btn btn-neutral"
          onclick={() => {
            for (let i = 1; i <= 10; i++) {
              setTimeout(() => toastStore.info(`Toast ${i} of 10`), i * 200)
            }
          }}
        >
          Show 10 Toasts (max 5)
        </button>
        <button class="btn btn-ghost" onclick={() => toastStore.clear()}> Clear All Toasts </button>
      </div>
    </div>
  </div>

  <div class="alert alert-info">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      class="stroke-current shrink-0 w-6 h-6"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      ></path>
    </svg>
    <span>
      Toasts appear in the top-right corner. Click buttons to test different toast types and
      behaviors.
    </span>
  </div>
</div>
