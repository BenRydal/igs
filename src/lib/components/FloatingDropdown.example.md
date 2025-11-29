# FloatingDropdown Component Usage Examples

## Basic Usage

```svelte
<script lang="ts">
  import FloatingDropdown from '$lib/components/FloatingDropdown.svelte'
</script>

<FloatingDropdown id="basic-menu" buttonText="Options">
  <ul class="menu">
    <li><button>Option 1</button></li>
    <li><button>Option 2</button></li>
    <li><button>Option 3</button></li>
  </ul>
</FloatingDropdown>
```

## Custom Button Content

```svelte
<script lang="ts">
  import FloatingDropdown from '$lib/components/FloatingDropdown.svelte'
  import UserAvatar from './UserAvatar.svelte'
</script>

<FloatingDropdown id="user-menu">
  {#snippet buttonChildren()}
    <UserAvatar user={currentUser} />
  {/snippet}

  <ul class="menu">
    <li><button>Profile</button></li>
    <li><button>Settings</button></li>
    <li><button>Logout</button></li>
  </ul>
</FloatingDropdown>
```

## Different Placements

```svelte
<!-- Top placement -->
<FloatingDropdown id="top-menu" placement="top" buttonText="Top Menu">
  <div class="p-4">Content appears above</div>
</FloatingDropdown>

<!-- Right placement -->
<FloatingDropdown id="right-menu" placement="right" buttonText="Right Menu">
  <div class="p-4">Content appears to the right</div>
</FloatingDropdown>
```

## Programmatic Control

```svelte
<script lang="ts">
  import FloatingDropdown from '$lib/components/FloatingDropdown.svelte'

  let dropdown: FloatingDropdown

  function openMenu() {
    dropdown.open()
  }

  function closeMenu() {
    dropdown.close()
  }
</script>

<button onclick={openMenu}>Open from outside</button>

<FloatingDropdown bind:this={dropdown} id="controlled-menu" buttonText="Controlled">
  <ul class="menu">
    <li><button onclick={closeMenu}>Close me</button></li>
  </ul>
</FloatingDropdown>
```

## Custom Styling

```svelte
<FloatingDropdown
  id="styled-menu"
  buttonClass="btn btn-primary btn-sm"
  contentClass="menu dropdown-content rounded-box w-64 p-4 shadow-lg bg-base-200"
  buttonText="Custom Styled"
>
  <div class="prose">
    <h3>Custom Content</h3>
    <p>Fully styled content area</p>
  </div>
</FloatingDropdown>
```

## Configuration Options

```svelte
<FloatingDropdown
  id="config-menu"
  buttonText="Configured"
  placement="bottom"
  offset={12}
  closeOnClickOutside={true}
  closeOnEscape={true}
>
  <ul class="menu">
    <li><button>Item</button></li>
  </ul>
</FloatingDropdown>
```

## Replacing Old Details/Summary Pattern

### Before:

```svelte
<details class="dropdown" use:clickOutside>
  <summary class="btn btn-sm">Filter</summary>
  <ul class="menu dropdown-content rounded-box z-[1] w-52 p-2 shadow bg-base-100">
    <li><button>Option 1</button></li>
  </ul>
</details>
```

### After:

```svelte
<FloatingDropdown id="filter-menu" buttonText="Filter">
  <ul class="menu">
    <li><button>Option 1</button></li>
  </ul>
</FloatingDropdown>
```
