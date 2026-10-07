<script lang="ts">
  import type { DataPoint } from '../../models/dataPoint'

  let { dataPoints }: { dataPoints: DataPoint[] } = $props()

  /**
   * Rows rendered at once.
   *
   * A movement trail runs to tens of thousands of points, and because the
   * surrounding collapse is CSS-only the rows are built for every user as soon
   * as the modal opens, expanded or not. Paging keeps the DOM a fixed size while
   * still allowing any point to be reached.
   */
  const PAGE_SIZE = 100

  let page = $state(0)

  let pageCount = $derived(Math.max(1, Math.ceil(dataPoints.length / PAGE_SIZE)))
  let currentPage = $derived(Math.min(page, pageCount - 1))
  let start = $derived(currentPage * PAGE_SIZE)
  let visible = $derived(dataPoints.slice(start, start + PAGE_SIZE))

  // The clamp has to be written back, not just applied to the derived view: if
  // `page` kept an out-of-range value, a trail that shrinks and then grows again
  // would jump to a page the reader never asked for.
  $effect(() => {
    if (page > pageCount - 1) page = pageCount - 1
  })
</script>

<div class="mt-2">
  {#if dataPoints.length > PAGE_SIZE}
    <div class="flex items-center gap-2 mb-2 text-sm">
      <button
        class="btn btn-xs"
        disabled={currentPage === 0}
        onclick={() => (page = currentPage - 1)}
      >
        Prev
      </button>
      <span>
        {start + 1}–{start + visible.length} of {dataPoints.length}
      </span>
      <button
        class="btn btn-xs"
        disabled={currentPage >= pageCount - 1}
        onclick={() => (page = currentPage + 1)}
      >
        Next
      </button>
    </div>
  {:else}
    <div class="mb-2 text-sm">{dataPoints.length} point{dataPoints.length === 1 ? '' : 's'}</div>
  {/if}

  <div class="overflow-x-auto">
    <table class="table w-full">
      <thead>
        <tr>
          <th>Time</th>
          <th>Speech</th>
          <th>X</th>
          <th>Y</th>
          <th>Stop Length</th>
          <th>Codes</th>
        </tr>
      </thead>
      <tbody>
        {#each visible as dataPoint}
          <tr>
            <td>{dataPoint.time}</td>
            <td>{dataPoint.speech}</td>
            <td>{dataPoint.x}</td>
            <td>{dataPoint.y}</td>
            <td>{dataPoint.stopLength}</td>
            <td>{dataPoint.codes.join(', ')}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
