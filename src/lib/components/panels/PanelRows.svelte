<script module lang="ts">
  import type { Component, Snippet } from 'svelte'
  import MdCheck from '~icons/mdi/check'

  export { icon, toggleRow, rangeRow, panelSection }
</script>

{#snippet icon(Icon: Component)}
  <div class="w-4 h-4"><Icon /></div>
{/snippet}

{#snippet check(condition: boolean)}
  <div class="w-4 h-4 mr-2">
    {#if condition}<MdCheck />{/if}
  </div>
{/snippet}

{#snippet toggleRow(label: string, on: boolean, onclick: () => void)}
  <li>
    <button {onclick} class="w-full text-left flex items-center" aria-pressed={on}>
      {@render check(on)}
      {label}
    </button>
  </li>
{/snippet}

{#snippet rangeRow(
  label: string,
  id: string,
  min: number,
  max: number,
  step: number,
  value: number,
  oninput: (e: Event & { currentTarget: HTMLInputElement }) => void
)}
  <div class="flex flex-col gap-1">
    <label for={id} class="text-xs">{label}</label>
    <input {id} type="range" {min} {max} {step} {value} class="range range-xs" {oninput} />
  </div>
{/snippet}

{#snippet panelSection(title: string, body: Snippet)}
  <section class="flex flex-col gap-2">
    <h3 class="text-xs font-semibold uppercase tracking-wide opacity-70">{title}</h3>
    {@render body()}
  </section>
{/snippet}
