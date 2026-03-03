<script lang="ts">
  import { EllipsisVertical } from '@lucide/svelte'
  import type { User } from '../../models/user'

  interface Props {
    user: User
    isVisible: boolean
    onToggleVisibility: () => void
    onOpenDropdown: (event: MouseEvent) => void
  }

  let { user, isVisible, onToggleVisibility, onOpenDropdown }: Props = $props()

  function handleSettingsClick(event: MouseEvent) {
    event.stopPropagation()
    onOpenDropdown(event)
  }
</script>

<div class="user-button-container" class:hidden-state={!isVisible}>
  <button
    class="user-button"
    onclick={onToggleVisibility}
    title={isVisible ? `Hide ${user.name}` : `Show ${user.name}`}
  >
    <span class="color-chip" style:background-color={user.color}></span>
    <span class="user-name">{user.name}</span>
  </button>
  <button
    class="settings-button"
    onclick={handleSettingsClick}
    title="Settings"
  >
    <EllipsisVertical class="settings-icon" size={16} />
  </button>
</div>

<style>
  .user-button-container {
    display: inline-flex;
    align-items: center;
    background-color: var(--viz-gray-200);
    border-radius: 9999px;
    transition: opacity 0.15s;
  }

  .user-button-container:hover {
    background-color: var(--viz-gray-300);
  }

  .user-button-container.hidden-state {
    opacity: 0.5;
  }

  .user-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.5rem 0.375rem 0.75rem;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--viz-gray-800);
    user-select: none;
    max-width: 8rem;
  }

  .settings-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem;
    padding-left: 0;
    padding-right: 0.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--viz-gray-500);
    transition: color 0.15s;
  }

  .settings-button:hover {
    color: var(--viz-gray-800);
  }

  .settings-icon {
    width: 16px;
    height: 16px;
  }

  .color-chip {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .hidden-state .color-chip {
    background-color: transparent !important;
    border: 2px solid currentColor;
    width: 10px;
    height: 10px;
  }

  .user-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
