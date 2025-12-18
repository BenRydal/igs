<script lang="ts">
  import { writable } from 'svelte/store'
  import { onMount, onDestroy } from 'svelte'

  let { isModalOpen = writable(false) } = $props()

  // Close modal on Escape key
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && $isModalOpen) {
      e.preventDefault()
      e.stopPropagation()
      $isModalOpen = false
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', handleKeyDown)
    }
  })
</script>

{#if $isModalOpen}
  <div class="modal modal-open">
    <div class="modal-box max-w-4xl py-10 px-12">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-800">Interaction Geography Slicer</h1>
      </div>

      <!-- Main description -->
      <p class="text-xl text-gray-600 leading-relaxed mb-8">
        Welcome to the Interaction Geography Slicer, an open-source tool to visualize movement,
        conversation, and video data over space and time. Data are displayed over a floor plan and
        timeline in 2D and 3D views. Use the top menu to explore sample datasets or upload your own
        data. Animate, filter, and interact with data in different ways.
      </p>

      <!-- Privacy note -->
      <div class="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-8">
        <p class="text-green-800">
          <strong>Privacy:</strong> Everything runs in your browser. No data is uploaded or transmitted.
        </p>
      </div>

      <!-- Action buttons -->
      <div class="flex flex-wrap justify-center gap-3 mb-8">
        <button
          onclick={() => {
            $isModalOpen = false
            window.dispatchEvent(new Event('restart-tour'))
          }}
          class="btn btn-outline"
        >
          Take Tour
        </button>
        <a
          href="https://www.youtube.com/watch?v=smoxv9AspHA"
          target="_blank"
          class="btn btn-outline"
        >
          Watch Demo
        </a>
        <a href="/images/data_formatting_guide.pdf" target="_blank" class="btn btn-outline">
          Data Format Guide
        </a>
        <a href="https://forms.gle/M1gvdgSvdH9yXAABA" target="_blank" class="btn btn-outline">
          Share Feedback
        </a>
      </div>

      <!-- Collapsible credits section -->
      <details class="mb-6">
        <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
          Credits & Citation
        </summary>
        <div class="mt-3 text-sm text-gray-600 space-y-3">
          <p>
            <a
              href="https://github.com/BenRydal/igs"
              class="text-blue-600 hover:underline"
              target="_blank">Open-source</a
            >
            project licensed under GNU GPL v3. Developed by Ben Rydal Shapiro, Edwin Zhao, and contributors.
            Supported by NSF #1623690 and #2100784. Example data is from the
            <a href="https://www.timssvideo.com" class="text-blue-600 hover:underline" target="_blank"
              >TIMSS 1999 Video Study</a
            >
            and
            <a
              href="https://deepblue.lib.umich.edu/handle/2027.42/65013"
              class="text-blue-600 hover:underline"
              target="_blank">Case of Sean Numbers</a
            > (U. Michigan). If using the IGS in your research, please cite:
          </p>
          <p class="italic bg-gray-50 p-3 rounded text-xs">
            Shapiro, B.R., Metts, E., & Zhao, E. (2025). The Interaction Geography Slicer: Designing
            Exploratory Spatial Data Visualization Tools for Teachers' Reflective Practice. In CHI
            Conference on Human Factors in Computing Systems (CHI '25), April 26–May 01, 2025,
            Yokohama, Japan. ACM, New York, NY, USA, 17 pages.
            <a
              href="https://doi.org/10.1145/3706598.3713499"
              class="text-blue-600 hover:underline"
              target="_blank">https://doi.org/10.1145/3706598.3713499</a
            >
          </p>
        </div>
      </details>

      <!-- Get Started button -->
      <div class="flex justify-center">
        <button class="btn btn-primary px-8" onclick={() => ($isModalOpen = false)}>
          Get Started
        </button>
      </div>
    </div>
  </div>
{/if}
