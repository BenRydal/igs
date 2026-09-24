<script lang="ts">
  import UserStore from '../../stores/userStore'
  import VideoStore from '../../stores/videoStore'
  import floorplanStore from '../../stores/floorplanStore'
  import { addUser } from '../history/user-actions'
  import { formatTime } from '../utils/format'
  import { recorder, setDrawAs, toggleRecording } from './session'

  let newName = $state('')
  let nameError = $state('')

  const people = $derived(
    $UserStore.map((user) => {
      const trail = user.dataTrail
      const first = trail[0]?.time ?? null
      const last = trail[trail.length - 1]?.time ?? null
      return {
        name: user.name,
        color: user.color,
        points: user.movementIsLoaded ? trail.length : 0,
        span: first !== null && last !== null && user.movementIsLoaded ? [first, last] : null,
      }
    })
  )

  const canRecord = $derived(!!$floorplanStore && !!$recorder.drawAs)

  function submitNewPerson(event: SubmitEvent) {
    event.preventDefault()
    const name = newName.trim()
    if (!addUser(name)) {
      nameError = name ? `“${name}” already exists` : 'Enter a name'
      return
    }
    setDrawAs(name)
    newName = ''
    nameError = ''
  }
</script>

<div class="flex flex-col gap-6 px-3 py-4">
  <section class="flex flex-col gap-2">
    <button
      id="btn-record"
      class="btn btn-sm gap-2"
      class:btn-error={$recorder.recording}
      class:btn-primary={!$recorder.recording}
      disabled={!canRecord}
      onclick={toggleRecording}
    >
      <span class="record-dot" class:recording={$recorder.recording} aria-hidden="true"></span>
      {$recorder.recording ? 'Stop recording' : 'Start recording'}
    </button>
    <p class="text-xs opacity-70">
      {#if !$floorplanStore}
        Load a floorplan from the Data tab to start drawing.
      {:else if !$recorder.drawAs}
        Choose or add a person below.
      {:else if $VideoStore.isLoaded}
        Click the floorplan (or the button) to play the video and record {$recorder.drawAs}'s path.
        Recording over earlier times replaces just that stretch.
      {:else}
        No video loaded: the timeline plays on its own while you draw, and the pointer is recorded
        against it.
      {/if}
    </p>
  </section>

  <section class="flex flex-col gap-2">
    <h3 class="text-xs font-semibold uppercase tracking-wide opacity-60">Draw as</h3>
    {#if people.length === 0}
      <p class="text-sm opacity-70">No people yet. Add one to start drawing.</p>
    {:else}
      <ul class="flex flex-col gap-1" role="radiogroup" aria-label="Person to draw as">
        {#each people as person (person.name)}
          {@const selected = $recorder.drawAs === person.name}
          <li>
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              class="person-row"
              class:selected
              onclick={() => setDrawAs(person.name)}
            >
              <span class="swatch" style:background-color={person.color}></span>
              <span class="flex-1 min-w-0 truncate text-left">{person.name}</span>
              <span class="text-xs opacity-60 shrink-0">
                {#if person.span}
                  {formatTime(person.span[0])}–{formatTime(person.span[1])}
                {:else}
                  no path
                {/if}
              </span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    <form class="flex flex-col gap-1" onsubmit={submitNewPerson}>
      <div class="join w-full">
        <input
          class="input input-sm join-item flex-1 min-w-0"
          placeholder="New person's name"
          aria-label="New person's name"
          bind:value={newName}
          oninput={() => (nameError = '')}
        />
        <button class="btn btn-sm join-item" type="submit">Add</button>
      </div>
      {#if nameError}
        <p class="text-xs text-error">{nameError}</p>
      {/if}
    </form>
  </section>
</div>

<style>
  .person-row {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.5rem;
    border-radius: 0.375rem;
    border: 1px solid transparent;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .person-row:hover {
    background: var(--color-base-200);
  }

  .person-row.selected {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }

  .swatch {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 9999px;
    flex-shrink: 0;
  }

  .record-dot {
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 9999px;
    background: currentColor;
  }

  .record-dot.recording {
    border-radius: 2px;
  }
</style>
