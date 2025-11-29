<script lang="ts">
  import { closeModal } from '$lib/../stores/modalStore'
  import { Z_INDEX } from '../styles/z-index'
  import UserStore from '../../stores/userStore'
  import CodeStore from '../../stores/codeStore'
  import { capitalizeEachWord } from '../utils/string'
  import DataPointTable from './DataPointTable.svelte'

  interface Props {
    isOpen: boolean
    onClose: () => void
  }

  let { isOpen = $bindable(), onClose }: Props = $props()

  let users = $derived($UserStore)
  let codes = $derived($CodeStore)

  // Close modal on escape key
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  // Close modal on backdrop click
  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // Unified close handler
  function handleClose() {
    onClose()
    closeModal('dataExplorer')
  }
</script>

{#if isOpen}
  <div
    class="modal modal-open"
    style="z-index: {Z_INDEX.MODAL}"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="data-explorer-title"
  >
    <div class="modal-box w-11/12 max-w-5xl">
      <!-- Header -->
      <div class="flex justify-between">
        <div class="flex flex-col">
          <h3 id="data-explorer-title" class="font-bold text-lg">Data Explorer</h3>
          <p>Here you will find detailed information on the data that you have uploaded.</p>
        </div>

        <button
          class="btn btn-circle btn-sm"
          onclick={handleClose}
          aria-label="Close data explorer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="overflow-x-auto">
        <div class="flex flex-col">
          <!-- Codes Section -->
          <div class="flex-col my-4">
            <h4 class="font-bold my-2">Codes:</h4>
            {#if codes.length > 0}
              <div class="grid grid-cols-5 gap-4">
                {#each codes as code}
                  <div class="badge badge-neutral">{code.code}</div>
                {/each}
              </div>
            {:else}
              <p class="text-sm text-gray-500">No codes available</p>
            {/if}
          </div>

          <!-- Users Section -->
          <h4 class="font-bold">Users:</h4>
          {#if users.length > 0}
            {#each users as user}
              <div class="my-4">
                <div
                  tabindex="0"
                  class="text-primary-content bg-[#e6e4df] collapse"
                  aria-controls="collapse-content-{user.name}"
                  role="button"
                >
                  <input type="checkbox" class="peer" />
                  <div class="collapse-title font-semibold">{capitalizeEachWord(user.name)}</div>

                  <div class="collapse-content">
                    <div class="flex flex-col">
                      <!-- User Color -->
                      <div class="flex">
                        <h2 class="font-medium">Color:</h2>
                        <div class="badge ml-2">{user.color}</div>
                      </div>

                      <!-- User Enabled Status -->
                      <div class="flex">
                        <h2 class="font-medium">Enabled</h2>
                        {#if user.enabled}
                          <div class="badge badge-success ml-2">{user.enabled}</div>
                        {:else}
                          <div class="badge badge-error ml-2">{user.enabled}</div>
                        {/if}
                      </div>
                    </div>

                    <!-- Data Points Table -->
                    <h2 class="font-medium">Data Points:</h2>
                    {#if user.dataTrail.length > 0}
                      <DataPointTable dataPoints={user.dataTrail} />
                    {:else}
                      <p class="text-sm text-gray-500 mt-2">
                        No data points available for this user
                      </p>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          {:else}
            <p class="text-sm text-gray-500 my-4">No users available</p>
          {/if}
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-action">
        <button class="btn" onclick={handleClose}>Close</button>
      </div>
    </div>
  </div>
{/if}
