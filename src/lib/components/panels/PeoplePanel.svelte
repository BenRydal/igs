<script lang="ts">
  import { EntityToggleList, type Entity } from 'svelte-p5-components'
  import MdChat from '~icons/mdi/chat'
  import MdWalk from '~icons/mdi/walk'
  import type { User } from '../../../models/user.ts'
  import UserStore from '../../../stores/userStore.ts'
  import { redrawCanvas } from '#lib/utils/p5.ts'
  import {
    toggleUserVisibility as toggleUserVisibilityAction,
    toggleUserEnabled,
    toggleUserConversationEnabled,
    setUserName,
    createUserColorDrag,
  } from '#lib/history/user-actions.ts'
  import { icon } from '#lib/components/panels/PanelRows.svelte'

  function isUserVisible(user: User): boolean {
    return user.enabled || user.conversation_enabled
  }

  function toggleUserVisibility(user: User) {
    toggleUserVisibilityAction(user.name, isUserVisible(user))
    redrawCanvas()
  }

  const userEntities = $derived<Entity[]>(
    $UserStore.map((user) => ({
      id: user.name,
      label: user.name,
      color: user.color,
      visible: isUserVisible(user),
    }))
  )

  function findUser(id: string): User | undefined {
    return $UserStore.find((u) => u.name === id)
  }

  const userColorDrag = createUserColorDrag()

  function handleUserColorInput(id: string, color: string) {
    userColorDrag.input(id, color)
    redrawCanvas()
  }
</script>

{#snippet userControls(entity: Entity)}
  {@const user = findUser(entity.id)}
  {#if user}
    <div class="flex items-center gap-1">
      <button
        class="btn btn-ghost btn-xs btn-square"
        class:opacity-40={!user.enabled}
        aria-pressed={user.enabled}
        aria-label="{user.enabled ? 'Hide' : 'Show'} movement for {user.name}"
        title="Movement"
        onclick={() => {
          toggleUserEnabled(user.name)
          redrawCanvas()
        }}
      >
        {@render icon(MdWalk)}
      </button>
      <button
        class="btn btn-ghost btn-xs btn-square"
        class:opacity-40={!user.conversation_enabled}
        aria-pressed={user.conversation_enabled}
        aria-label="{user.conversation_enabled ? 'Hide' : 'Show'} talk for {user.name}"
        title="Talk"
        onclick={() => {
          toggleUserConversationEnabled(user.name)
          redrawCanvas()
        }}
      >
        {@render icon(MdChat)}
      </button>
    </div>
  {/if}
{/snippet}

<div class="flex flex-col gap-6 px-3 py-4">
  {#if userEntities.length === 0}
    <p class="text-sm opacity-70">Load an example or import data to see people here.</p>
  {:else}
    <p class="text-xs opacity-70">
      Click a name to show or hide everything for that person. The icons toggle movement and talk
      separately.
    </p>
    <EntityToggleList
      entities={userEntities}
      onToggle={(id) => {
        const user = findUser(id)
        if (user) toggleUserVisibility(user)
      }}
      onColorChange={handleUserColorInput}
      onRename={(id, next) => {
        setUserName(id, next)
        redrawCanvas()
      }}
      controls={userControls}
      class="igs-people"
    />
  {/if}
</div>

<style>
  :global(.igs-people .entity-toggle-list__item) {
    flex: 1 1 100%;
  }

  :global(.igs-people .entity-toggle-list__label) {
    flex: 1 1 auto;
    min-width: 0;
  }
</style>
