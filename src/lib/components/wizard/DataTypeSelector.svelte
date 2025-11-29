<script lang="ts">
  import type { DataFileType } from '$lib/validation/types'

  interface Props {
    selectedType?: DataFileType | null
    onSelect: (type: DataFileType) => void
  }

  let { selectedType = $bindable(null), onSelect }: Props = $props()

  interface DataTypeCard {
    type: DataFileType
    icon: string
    title: string
    description: string
    acceptedTypes: string
  }

  const dataTypes: DataTypeCard[] = [
    {
      type: 'movement',
      icon: '📍',
      title: 'Movement Data',
      description: 'Person or object positions tracked over time',
      acceptedTypes: '.csv (time, x, y columns)',
    },
    {
      type: 'conversation',
      icon: '💬',
      title: 'Conversation Data',
      description: 'Timestamped speech and dialogue data',
      acceptedTypes: '.csv (time, speaker, talk)',
    },
    {
      type: 'singleCode',
      icon: '🏷️',
      title: 'Single Code',
      description: 'Time-based category for single code type',
      acceptedTypes: '.csv (start, end)',
    },
    {
      type: 'multiCode',
      icon: '🏷️',
      title: 'Multiple Codes',
      description: 'Time-based categories with multiple code types',
      acceptedTypes: '.csv (code, start, end)',
    },
  ]

  function handleSelect(type: DataFileType) {
    selectedType = type
    onSelect(type)
  }
</script>

<div class="p-6">
  <h2 class="text-xl font-bold mb-2">Select Data Type</h2>
  <p class="text-sm text-gray-600 mb-6">Choose the type of data you want to import</p>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each dataTypes as dataType}
      <button
        class="card bg-base-100 shadow-md hover:shadow-lg transition-all duration-200 border-2 {selectedType ===
        dataType.type
          ? 'border-primary bg-primary/10'
          : 'border-transparent hover:border-primary/50'}"
        onclick={() => handleSelect(dataType.type)}
        aria-pressed={selectedType === dataType.type}
      >
        <div class="card-body p-6">
          <div class="flex items-start gap-4">
            <div class="text-4xl">{dataType.icon}</div>
            <div class="flex-1 text-left">
              <h3 class="card-title text-lg mb-1">{dataType.title}</h3>
              <p class="text-sm text-gray-600 mb-2">{dataType.description}</p>
              <div class="badge badge-sm badge-ghost">{dataType.acceptedTypes}</div>
            </div>
          </div>
        </div>
      </button>
    {/each}
  </div>

  {#if selectedType}
    <div class="alert alert-info mt-6">
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
      <span
        >Selected: <strong>{dataTypes.find((dt) => dt.type === selectedType)?.title}</strong></span
      >
    </div>
  {/if}
</div>
