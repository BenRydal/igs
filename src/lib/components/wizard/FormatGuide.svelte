<script lang="ts">
  import type { DataFileType } from '$lib/validation/types'

  interface Props {
    selectedDataType: DataFileType
    onDontShowAgain?: (value: boolean) => void
  }

  let { selectedDataType, onDontShowAgain }: Props = $props()

  let dontShowAgain = $state(false)

  interface FormatExample {
    headers: Array<{ name: string; required: boolean }>
    rows: string[][]
    description: string
    timeFormat: string
  }

  const formatExamples: Record<DataFileType, FormatExample | null> = {
    movement: {
      headers: [
        { name: 'time', required: true },
        { name: 'x', required: true },
        { name: 'y', required: true },
        { name: 'name', required: false },
      ],
      rows: [
        ['0.0', '150', '200', 'alice'],
        ['0.5', '155', '205', 'alice'],
        ['1.0', '160', '210', 'alice'],
        ['1.5', '165', '215', 'alice'],
      ],
      description:
        'Movement data tracks positions over time. Include "name" column for multiple users.',
      timeFormat: 'Seconds from start (e.g., 0.0, 0.5, 1.0)',
    },
    conversation: {
      headers: [
        { name: 'time', required: true },
        { name: 'speaker', required: true },
        { name: 'talk', required: true },
        { name: 'end', required: false },
      ],
      rows: [
        ['5.2', 'Alice', 'Hello everyone', '7.5'],
        ['8.0', 'Bob', 'Hi Alice', '10.2'],
        ['12.5', 'Alice', 'How are you?', '15.0'],
      ],
      description:
        'Conversation data captures timestamped speech. Use "end" column for turn duration.',
      timeFormat: 'Seconds from start (e.g., 5.2, 8.0, 12.5)',
    },
    singleCode: {
      headers: [
        { name: 'start', required: true },
        { name: 'end', required: true },
      ],
      rows: [
        ['0.0', '15.5'],
        ['20.0', '35.2'],
        ['40.5', '60.0'],
      ],
      description: 'Single code format for one category type. Filename becomes the code name.',
      timeFormat: 'Start and end times in seconds',
    },
    multiCode: {
      headers: [
        { name: 'code', required: true },
        { name: 'start', required: true },
        { name: 'end', required: true },
        { name: 'color', required: false },
      ],
      rows: [
        ['discussion', '0.0', '15.5', '#FF6B6B'],
        ['activity', '20.0', '35.2', '#4ECDC4'],
        ['discussion', '40.5', '60.0', '#FF6B6B'],
      ],
      description: 'Multiple codes format allows different category types. Color is optional.',
      timeFormat: 'Start and end times in seconds',
    },
    unknown: null,
  }

  const currentFormat = $derived(formatExamples[selectedDataType])

  function generateTemplateCSV() {
    if (!currentFormat) return

    const headers = currentFormat.headers.map((h) => h.name).join(',')
    const rows = currentFormat.rows.map((row) => row.join(',')).join('\n')
    const csv = `${headers}\n${rows}`

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedDataType}-template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleDontShowChange() {
    onDontShowAgain?.(dontShowAgain)
  }
</script>

<div class="p-6">
  <h2 class="text-xl font-bold mb-2">Format Guide</h2>
  <p class="text-sm text-gray-600 mb-6">Learn about the required format for your data</p>

  {#if currentFormat}
    <div class="space-y-4">
      <!-- Description -->
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
        <span>{currentFormat.description}</span>
      </div>

      <!-- Required Headers -->
      <div>
        <h3 class="font-semibold mb-2">Required Columns:</h3>
        <div class="flex flex-wrap gap-2">
          {#each currentFormat.headers as header}
            <div
              class="badge {header.required ? 'badge-primary' : 'badge-ghost'} badge-lg"
              title={header.required ? 'Required' : 'Optional'}
            >
              {header.name}
              {#if !header.required}
                <span class="text-xs ml-1">(optional)</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Time Format -->
      <div>
        <h3 class="font-semibold mb-2">Time Format:</h3>
        <div class="badge badge-outline">{currentFormat.timeFormat}</div>
      </div>

      <!-- Example Table -->
      <div>
        <h3 class="font-semibold mb-2">Example Data:</h3>
        <div class="overflow-x-auto">
          <table class="table table-zebra table-sm">
            <thead>
              <tr>
                {#each currentFormat.headers as header}
                  <th class="font-bold">{header.name}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each currentFormat.rows as row}
                <tr>
                  {#each row as cell}
                    <td>{cell}</td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-4 items-start">
        <button class="btn btn-primary btn-sm" onclick={generateTemplateCSV}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download Template
        </button>

        <a
          href="https://www.interactiongeography.org"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-ghost btn-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Full Documentation
        </a>
      </div>

      <!-- Don't Show Again -->
      {#if onDontShowAgain}
        <div class="form-control">
          <label class="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              bind:checked={dontShowAgain}
              onchange={handleDontShowChange}
              class="checkbox checkbox-sm"
            />
            <span class="label-text">Don't show this guide again</span>
          </label>
        </div>
      {/if}
    </div>
  {:else}
    <div class="alert alert-warning">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="stroke-current shrink-0 h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <span>Unknown data type selected. Please go back and select a valid data type.</span>
    </div>
  {/if}
</div>
