<script lang="ts">
  import { writable } from 'svelte/store'
  import { onMount, onDestroy } from 'svelte'
  import MdRoute from '~icons/mdi/routes'
  import MdChat from '~icons/mdi/chat-outline'
  import MdVideo from '~icons/mdi/video-outline'
  import MdCube from '~icons/mdi/cube-outline'
  import MdPlayCircle from '~icons/mdi/play-circle-outline'
  import MdFileDocument from '~icons/mdi/file-document-outline'
  import MdCompass from '~icons/mdi/compass-outline'
  import MdMessage from '~icons/mdi/message-outline'

  let { isModalOpen = writable(false) } = $props()

  let showCitation = $state(false)

  const examples = [
    { id: 'example-1', title: "Jordan's Last Shot", duration: '37 sec', image: '/images/1-example-jordan.png' },
    { id: 'example-2', title: 'Museum Gallery Visit', duration: '8 min', image: '/images/2-example-museum.png' },
    { id: 'example-3', title: 'Classroom Lesson', duration: '56 min', image: '/images/3-example-timss.png' },
    { id: 'example-12', title: 'Walking Tour', duration: '43 min', image: '/images/4-example-tour.png' },
  ]

  function loadExample(exampleId: string) {
    closeModal()
    window.dispatchEvent(new CustomEvent('igs:load-example', { detail: { value: exampleId } }))
  }

  function closeModal() {
    showCitation = false
    $isModalOpen = false
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && $isModalOpen) {
      e.preventDefault()
      e.stopPropagation()
      closeModal()
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
    <div class="modal-box max-w-5xl p-10 relative">
      <!-- Close button -->
      <button
        onclick={closeModal}
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
        aria-label="Close"
      >&times;</button>

      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-800">Interaction Geography Slicer</h1>
        <p class="text-xl text-gray-500 mt-3">Dynamically visualize how people move and interact over space and time</p>

        <!-- Feature strip -->
        <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 mt-5 text-base text-gray-400">
          <span class="flex items-center gap-1.5"><MdRoute /> Movement over time</span>
          <span class="flex items-center gap-1.5"><MdChat /> Conversation in space</span>
          <span class="flex items-center gap-1.5"><MdVideo /> Synced video</span>
          <span class="flex items-center gap-1.5"><MdCube /> 2D & 3D views</span>
        </div>
      </div>

      <!-- Example cards -->
      <p class="text-base text-gray-500 text-center mb-4 uppercase tracking-wide">Try an example</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {#each examples as example}
          <button
            onclick={() => loadExample(example.id)}
            class="group flex flex-col rounded-lg border border-base-300 overflow-hidden hover:border-primary hover:shadow-md transition-all cursor-pointer"
          >
            <div class="aspect-square bg-base-200 relative overflow-hidden">
              <img
                src={example.image}
                alt={example.title}
                class="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <span class="absolute bottom-1 right-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
                {example.duration}
              </span>
            </div>
            <div class="p-2.5 text-center">
              <p class="font-medium text-base leading-tight">{example.title}</p>
            </div>
          </button>
        {/each}
      </div>

      <!-- Secondary actions -->
      <div class="flex flex-wrap justify-center gap-3 mb-4">
        <button
          onclick={() => { closeModal(); window.dispatchEvent(new Event('restart-tour')) }}
          class="btn btn-ghost gap-1.5"
        >
          <MdCompass class="text-lg" /> Take a Tour
        </button>
        <a href="https://www.youtube.com/watch?v=smoxv9AspHA" target="_blank" class="btn btn-ghost gap-1.5">
          <MdPlayCircle class="text-lg" /> Watch Demo
        </a>
        <a href="/guide" class="btn btn-ghost gap-1.5">
          <MdFileDocument class="text-lg" /> Data Format Guide
        </a>
        <a href="https://forms.gle/M1gvdgSvdH9yXAABA" target="_blank" class="btn btn-ghost gap-1.5">
          <MdMessage class="text-lg" /> Feedback
        </a>
      </div>

      <!-- Start button -->
      <div class="text-center mb-8">
        <button onclick={closeModal} class="btn btn-primary btn-lg">Start Slicing</button>
      </div>

      <!-- Footer -->
      <div class="text-sm text-gray-500">
        <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span class="flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-green-500"></span>
            100% private — runs in your browser
          </span>
          <span>•</span>
          <a href="https://github.com/BenRydal/igs" target="_blank" class="hover:underline">Open source (GPL v3)</a>
          <span>•</span>
          <button onclick={() => (showCitation = !showCitation)} class="hover:underline cursor-pointer">Citation</button>
        </div>

        {#if showCitation}
          <div class="mt-4 p-4 bg-base-200 rounded-lg text-left text-sm">
            <p class="text-gray-600">
              Shapiro, B.R., Metts, E., & Zhao, E. (2025). The Interaction Geography Slicer: Designing
              Exploratory Spatial Data Visualization Tools for Teachers' Reflective Practice. CHI '25.
              <a href="https://doi.org/10.1145/3706598.3713499" target="_blank" class="text-blue-600 hover:underline">
                https://doi.org/10.1145/3706598.3713499
              </a>
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
