<script lang="ts">
	import type { DataPoint } from '../../models/dataPoint';

	export let dataPoints: DataPoint[];
</script>

<div class="overflow-x-auto mt-2">
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
			{#each dataPoints as dataPoint}
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
