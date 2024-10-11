<script lang="ts">
	export let icon: ConstructorOfATypedSvelteComponent;
	export let tooltip: string = '';
	export let id: string = '';
</script>

<div
	data-tip={tooltip}
	class="tooltip tooltip-bottom btn capitalize icon max-h-8 bg-[#ffffff] border-[#ffffff] max-w-16 flex items-center justify-center"
	role="button"
	tabindex="0"
	{id}
	on:click
	on:keydown
>
	<svelte:component this={icon} />
</div>
