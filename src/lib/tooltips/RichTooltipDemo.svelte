<script lang="ts">
  /**
   * RichTooltip Demo Component
   *
   * Demonstrates various tooltip configurations and use cases.
   * This is a reference component - not meant for production use.
   */
  import { RichTooltip, getTooltip } from '$lib/tooltips'
  import MdPlay from '~icons/mdi/play'
  import MdUpload from '~icons/mdi/upload'
  import MdSettings from '~icons/mdi/cog'
  import Md3D from '~icons/mdi/rotate-3d-variant'
</script>

<div class="demo-container">
  <h2>RichTooltip Demo</h2>
  <p class="demo-instructions">Hover over or focus each button to see different tooltip styles</p>

  <div class="demo-section">
    <h3>Using Registry (Recommended)</h3>
    <div class="button-group">
      <!-- Play/Pause with shortcut -->
      <RichTooltip {...getTooltip('play-pause')}>
        <button class="btn btn-circle btn-primary">
          <MdPlay />
        </button>
      </RichTooltip>

      <!-- Upload button -->
      <RichTooltip {...getTooltip('upload-button')} placement="bottom">
        <button class="btn btn-sm gap-2">
          <MdUpload />
          Upload
        </button>
      </RichTooltip>

      <!-- Settings -->
      <RichTooltip {...getTooltip('open-settings')} placement="right">
        <button class="btn btn-square btn-ghost">
          <MdSettings />
        </button>
      </RichTooltip>
    </div>
  </div>

  <div class="demo-section">
    <h3>Custom Tooltips</h3>
    <div class="button-group">
      <!-- Title only -->
      <RichTooltip title="Simple Tooltip">
        <button class="btn btn-sm">Hover Me</button>
      </RichTooltip>

      <!-- Title + Description -->
      <RichTooltip
        title="Detailed Tooltip"
        description="This tooltip has both a title and a longer description to provide more context about what this control does."
      >
        <button class="btn btn-sm">With Description</button>
      </RichTooltip>

      <!-- All options -->
      <RichTooltip
        title="Full Featured"
        description="This tooltip demonstrates all available options including title, description, and keyboard shortcut."
        shortcut="Ctrl+F"
        placement="left"
      >
        <button class="btn btn-sm">Complete</button>
      </RichTooltip>
    </div>
  </div>

  <div class="demo-section">
    <h3>Different Placements</h3>
    <div class="placement-grid">
      <RichTooltip title="Top Placement" description="Default placement" placement="top">
        <button class="btn btn-sm">Top</button>
      </RichTooltip>

      <RichTooltip title="Right Placement" description="Shows on the right" placement="right">
        <button class="btn btn-sm">Right</button>
      </RichTooltip>

      <RichTooltip title="Bottom Placement" description="Shows below" placement="bottom">
        <button class="btn btn-sm">Bottom</button>
      </RichTooltip>

      <RichTooltip title="Left Placement" description="Shows on the left" placement="left">
        <button class="btn btn-sm">Left</button>
      </RichTooltip>
    </div>
  </div>

  <div class="demo-section">
    <h3>Delay Options</h3>
    <div class="button-group">
      <RichTooltip title="Instant" description="No delay (0ms)" delay={0}>
        <button class="btn btn-sm">0ms</button>
      </RichTooltip>

      <RichTooltip title="Quick" description="Short delay (200ms)" delay={200}>
        <button class="btn btn-sm">200ms</button>
      </RichTooltip>

      <RichTooltip title="Default" description="Default delay (500ms)">
        <button class="btn btn-sm">500ms (default)</button>
      </RichTooltip>

      <RichTooltip title="Slow" description="Long delay (1000ms)" delay={1000}>
        <button class="btn btn-sm">1000ms</button>
      </RichTooltip>
    </div>
  </div>

  <div class="demo-section">
    <h3>Real-world Examples</h3>
    <div class="toolbar-demo">
      <!-- Simulated toolbar -->
      <RichTooltip {...getTooltip('toggle-3d')}>
        <button class="btn btn-circle btn-sm">
          <Md3D />
        </button>
      </RichTooltip>

      <RichTooltip {...getTooltip('rotate-left')}>
        <button class="btn btn-sm">Rotate L</button>
      </RichTooltip>

      <RichTooltip {...getTooltip('rotate-right')}>
        <button class="btn btn-sm">Rotate R</button>
      </RichTooltip>

      <div class="divider"></div>

      <RichTooltip {...getTooltip('movement-toggle')}>
        <button class="btn btn-sm">Movement</button>
      </RichTooltip>

      <RichTooltip {...getTooltip('conversation-toggle')}>
        <button class="btn btn-sm">Conversation</button>
      </RichTooltip>
    </div>
  </div>

  <div class="demo-section">
    <h3>Accessibility Test</h3>
    <p class="demo-note">
      Try using Tab to focus these buttons - tooltips should show immediately on focus
    </p>
    <div class="button-group">
      <RichTooltip
        title="Keyboard Accessible"
        description="Focus with Tab key to see instant tooltip"
      >
        <button class="btn btn-sm">Tab to Me</button>
      </RichTooltip>

      <RichTooltip
        title="Screen Reader Friendly"
        description="Uses aria-describedby for accessibility"
      >
        <button class="btn btn-sm">Accessible</button>
      </RichTooltip>
    </div>
  </div>
</div>

<style>
  .demo-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .demo-container h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .demo-instructions {
    color: rgb(100 116 139); /* slate-500 */
    margin-bottom: 2rem;
  }

  .demo-section {
    margin-bottom: 3rem;
    padding: 1.5rem;
    background: rgb(248 250 252); /* slate-50 */
    border-radius: 0.5rem;
  }

  .demo-section h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .demo-note {
    font-size: 0.875rem;
    color: rgb(100 116 139); /* slate-500 */
    margin-bottom: 1rem;
    font-style: italic;
  }

  .button-group {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .placement-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
    max-width: 600px;
  }

  .toolbar-demo {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 0.75rem;
    background: white;
    border-radius: 0.5rem;
    width: fit-content;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  }

  .divider {
    width: 1px;
    height: 2rem;
    background: rgb(226 232 240); /* slate-200 */
    margin: 0 0.5rem;
  }
</style>
