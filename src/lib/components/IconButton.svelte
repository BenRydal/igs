<script lang="ts">
	export let icon: ConstructorOfATypedSvelteComponent;
	export let id: string = '';
</script>

<div class="btn icon max-h-8" role="button" tabindex="0" {id} on:click on:keydown>
	<svelte:component this={icon} />
</div>
