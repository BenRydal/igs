<script lang="ts">
  import { onDestroy } from 'svelte'
  import { computePosition, flip, shift, offset } from '@floating-ui/dom'
  import { clickOutside } from '$lib/actions/clickOutside'
  import { Z_INDEX } from '$lib/styles/z-index'
  import '$lib/styles/dropdown.css'
  import type { User } from '../../models/user'
  import {
    toggleUserEnabled,
    toggleUserConversationEnabled,
    setUserColor,
    setUserName,
  } from '$lib/history/user-actions'
  import P5Store from '../../stores/p5Store'
  import type p5 from 'p5'

  interface Props {
    user: User | null
    anchorX: number
    anchorY: number
    onClose: () => void
  }

  let { user, anchorX, anchorY, onClose }: Props = $props()

  let dropdownElement = $state<HTMLDivElement | null>(null)
  let p5Instance: p5 | null = null
  let clickOutsideEnabled = $state(false)

  const unsubscribeP5 = P5Store.subscribe((instance) => {
    p5Instance = instance
  })

  onDestroy(unsubscribeP5)

  // Delay enabling clickOutside to avoid the opening click triggering close
  $effect(() => {
    if (user) {
      clickOutsideEnabled = false
      const timer = setTimeout(() => {
        clickOutsideEnabled = true
      }, 100)
      return () => clearTimeout(timer)
    } else {
      clickOutsideEnabled = false
    }
  })

  // Position dropdown near the click/long-press location
  $effect(() => {
    if (user && dropdownElement) {
      // Create a virtual anchor element at the pointer position
      const virtualAnchor = {
        getBoundingClientRect() {
          return {
            x: anchorX,
            y: anchorY,
            top: anchorY,
            left: anchorX,
            bottom: anchorY,
            right: anchorX,
            width: 0,
            height: 0,
          }
        },
      }

      computePosition(virtualAnchor as Element, dropdownElement, {
        placement: 'top',
        middleware: [offset(8), flip(), shift({ padding: 8 })],
      }).then(({ x, y }) => {
        if (dropdownElement) {
          dropdownElement.style.left = `${x}px`
          dropdownElement.style.top = `${y}px`
        }
      })
    }
  })

  function handleNameChange(e: Event) {
    if (!user) return
    const oldName = user.name
    const newName = (e.currentTarget as HTMLInputElement).value.trim()
    if (newName && newName !== oldName) {
      setUserName(oldName, newName)
      p5Instance?.loop()
      onClose()
    }
  }

  function handleMovementToggle() {
    if (!user) return
    toggleUserEnabled(user.name)
    p5Instance?.loop()
  }

  function handleTalkToggle() {
    if (!user) return
    toggleUserConversationEnabled(user.name)
    p5Instance?.loop()
  }

  function handleColorChange(e: Event) {
    if (!user) return
    setUserColor(user.name, (e.currentTarget as HTMLInputElement).value)
    p5Instance?.loop()
  }

</script>

<svelte:window onkeydown={(e) => user && e.key === 'Escape' && onClose()} />

{#if user}
  <div
    bind:this={dropdownElement}
    class="user-dropdown"
    style:z-index={Z_INDEX.DROPDOWN}
    use:clickOutside={{
      onClickOutside: onClose,
      enabled: clickOutsideEnabled,
    }}
    role="menu"
  >
    <ul class="dropdown-content">
      <!-- Name Input -->
      <li class="dropdown-item">
        <input
          type="text"
          class="name-input"
          value={user.name}
          onchange={handleNameChange}
          placeholder="User name"
        />
      </li>

      <!-- Movement -->
      <li class="dropdown-item">
        <label class="checkbox-label">
          <input type="checkbox" class="checkbox" checked={user.enabled} onchange={handleMovementToggle} />
          Movement
        </label>
      </li>

      <!-- Talk -->
      <li class="dropdown-item">
        <label class="checkbox-label">
          <input
            type="checkbox"
            class="checkbox"
            checked={user.conversation_enabled}
            onchange={handleTalkToggle}
          />
          Talk
        </label>
      </li>

      <!-- Divider -->
      <li class="divider"></li>

      <!-- Color -->
      <li class="dropdown-item">
        <div class="color-row">
          <input type="color" class="color-picker" value={user.color} onchange={handleColorChange} />
          <span>Color</span>
        </div>
      </li>
    </ul>
  </div>
{/if}

<style>
  .user-dropdown {
    position: fixed;
    background: white;
    border-radius: 0.5rem;
    box-shadow:
      0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1);
    padding: 0.5rem;
    min-width: 180px;
  }

  .name-input {
    width: 100%;
    padding: 0.375rem 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
  }

  .name-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgb(59 130 246 / 0.2);
  }
</style>
