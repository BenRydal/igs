<script lang="ts">
  import MdChevronLeft from '~icons/mdi/chevron-left'
  import type { User } from '../../models/user'
  import UserButton from './UserButton.svelte'

  interface Props {
    users: User[]
    isUserVisible: (user: User) => boolean
    onToggleVisibility: (user: User) => void
    onOpenDropdown: (user: User, event: MouseEvent) => void
    maxVisible?: number
  }

  let {
    users,
    isUserVisible,
    onToggleVisibility,
    onOpenDropdown,
    maxVisible = 6,
  }: Props = $props()

  let isExpanded = $state(false)

  const visibleUsers = $derived(
    isExpanded || users.length <= maxVisible ? users : users.slice(0, maxVisible - 1)
  )

  const hiddenCount = $derived(users.length - maxVisible + 1)
  const showExpandButton = $derived(users.length > maxVisible)

  function toggleExpanded() {
    isExpanded = !isExpanded
  }
</script>

<div class="user-button-group">
  {#each visibleUsers as user (user.name)}
    <UserButton
      {user}
      isVisible={isUserVisible(user)}
      onToggleVisibility={() => onToggleVisibility(user)}
      onOpenDropdown={(event) => onOpenDropdown(user, event)}
    />
  {/each}

  {#if showExpandButton}
    <button class="expand-button" onclick={toggleExpanded} title={isExpanded ? 'Show fewer' : `Show ${hiddenCount} more`}>
      {#if isExpanded}
        <MdChevronLeft class="collapse-icon" />
      {:else}
        +{hiddenCount}
      {/if}
    </button>
  {/if}
</div>

<style>
  .user-button-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: nowrap;
  }

  .expand-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.5rem;
    padding: 0.375rem 0.625rem;
    border-radius: 9999px;
    background-color: #e5e5e5;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    color: #6b7280;
    transition: background-color 0.15s;
    user-select: none;
  }

  .expand-button:hover {
    background-color: #d4d4d4;
  }

  .expand-button:active {
    background-color: #c4c4c4;
  }

  .collapse-icon {
    width: 1rem;
    height: 1rem;
  }
</style>
