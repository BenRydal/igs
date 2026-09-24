<script lang="ts">
  import {
    type SavedSession,
    getSessionAge,
    getTotalPointCount,
  } from '$lib/mondrian-tool/stores/sessionRecovery'
  import IconRestore from '~icons/material-symbols/history'
  import IconInfo from '~icons/material-symbols/info-outline'

  interface Props {
    session: SavedSession
    onRestore: () => void
    onDiscard: () => void
  }

  let { session, onRestore, onDiscard }: Props = $props()

  const pathCount = session.paths.filter((p) => p.points.length > 0).length
  const totalPoints = getTotalPointCount(session.paths)
  const sessionAge = getSessionAge(session.timestamp)
  const mode = session.config.isTranscriptionMode ? 'Transcription' : 'Speculate'
  const hasFloorPlan = !!session.floorPlanDataUrl
</script>

<div class="modal modal-open" data-ui-element>
  <div class="modal-box max-w-md">
    <h3 class="font-bold text-lg flex items-center gap-2">
      <IconRestore class="h-6 w-6 text-warning" />
      Recover Previous Session?
    </h3>

    <div class="py-4 space-y-3">
      <p class="text-base-content/70">
        Found unsaved work from <span class="font-medium">{sessionAge}</span>
      </p>

      <div class="bg-base-200 rounded-lg p-3 space-y-1 text-sm">
        <div class="flex justify-between">
          <span class="text-base-content/60">Mode:</span>
          <span class="font-medium">{mode}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-base-content/60">Paths:</span>
          <span class="font-medium">{pathCount}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-base-content/60">Total points:</span>
          <span class="font-medium">{totalPoints.toLocaleString()}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-base-content/60">Floor plan:</span>
          <span class="font-medium">{hasFloorPlan ? 'Saved' : 'Not saved'}</span>
        </div>
      </div>

      {#if session.config.isTranscriptionMode}
        <div class="alert alert-info text-sm py-2">
          <IconInfo class="h-5 w-5 shrink-0" />
          {#if !hasFloorPlan}
            <span>You'll need to re-upload your floor plan and video to continue recording.</span>
          {:else}
            <span>You'll need to re-upload your video to continue recording.</span>
          {/if}
        </div>
      {:else if !hasFloorPlan}
        <div class="alert alert-info text-sm py-2">
          <IconInfo class="h-5 w-5 shrink-0" />
          <span>You'll need to re-upload your floor plan to continue recording.</span>
        </div>
      {/if}
    </div>

    <div class="modal-action">
      <button class="btn btn-ghost" onclick={onDiscard}>Start Fresh</button>
      <button class="btn btn-primary" onclick={onRestore}>Restore Session</button>
    </div>
  </div>
  <button
    class="modal-backdrop bg-black/50 border-none cursor-default"
    onclick={onDiscard}
    aria-label="Close modal"
  ></button>
</div>
