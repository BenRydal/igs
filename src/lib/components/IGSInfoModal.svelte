<script lang="ts">
	import { writable } from 'svelte/store';
	export let isModalOpen = writable(false);

	function openGoogleForm() {
		window.open('https://forms.gle/M1gvdgSvdH9yXAABA', '_blank');
	}
</script>

{#if $isModalOpen}
	<input type="checkbox" bind:checked={$isModalOpen} id="my-modal" class="modal-toggle" />
	<div class="modal">
		<div class="modal-box max-w-7xl">
			<div class="hero p-10">
				<div class="hero-content text-left">
					<div class="">
						<h1 class="text-5xl font-bold pb-8 text-center">INTERACTION GEOGRAPHY SLICER</h1>
						<p class="py-3 text-lg">
							Welcome to the Interaction Geography Slicer! The IGS is an open-source tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan and
							a timeline in 2D and 3D views. Use the top menu to explore sample datasets or upload your own data. Interact with data by visualizing movement and conversation in different ways, animating
							and filtering data, watching video, and rescaling data with the interactive timeline.
						</p>
						<div class="flex flex-row justify-center flex-wrap gap-4 my-2">
							<a href="https://youtu.be/FdDVpAYaZwE" target="_blank" class="btn bg-gray-300 text-black">Watch Demo Video</a>
							<a href="https://www.benrydal.com/software/igs" target="_blank" class="btn bg-gray-300 text-black">Data Collection/Formatting Guide</a>
							<a href="https://www.benrydal.com/interactiongeography" target="_blank" class="btn bg-gray-300 text-black">Learn About Interaction Geography</a>
							<a href="https://github.com/BenRydal/igs" target="_blank" class="btn bg-gray-300 text-black">Contribute</a>
							<!-- <a href="https://link.springer.com/article/10.1007/s11412-017-9264-8" target="_blank" class="btn bg-gray-300 text-black">Reference</a> -->
							<a href="https://journals.sagepub.com/doi/abs/10.3102/0013189X241238698" target="_blank" class="btn bg-gray-300 text-black">Reference</a>
						</div>
						<p class="pt-3 pb-6 italic text-center">
							IGS software is an open-source project built with Svelte, JavaScript and p5.js licensed under the GNU General Public License Version 2.0. It is
							developed by Ben Rydal Shapiro, Edwin Zhao and contributors with support from the National Science Foundation #1623690 and #2100784.
						</p>
						<div class="modal-action flex justify-center">
							<a href="https://forms.gle/M1gvdgSvdH9yXAABA" target="_blank" class="btn bg-gray-300 text-black">Feedback</a>
							<button class="btn btn-primary" on:click={() => ($isModalOpen = false)}>
								Get Started
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
