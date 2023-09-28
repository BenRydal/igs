<script lang="ts">
	import { writable } from 'svelte/store';
	export let isModalOpen = writable(false);
</script>

{#if $isModalOpen}
	<input type="checkbox" bind:checked={$isModalOpen} id="my-modal" class="modal-toggle" />
	<div class="modal">
		<div class="modal-box max-w-7xl">
			<div class="hero p-20">
				<div class="hero-content text-left">
					<div class="max-w-16">
						<h1 class="text-5xl font-bold pb-8">INTERACTION GEOGRAPHY SLICER (IGS)</h1>
						<p class="py-3">
							Hello! This is a tool to visualize movement, conversation, and video data over space
							and time. Data are displayed over a floor plan and a timeline and can be viewed in 2D
							or 3D.
						</p>
						<p class="py-3">
							Use the top menu to visualize different sample datasets or upload your own data. Use
							the bottom left tabs as well as the timeline to selectively study displayed data. For
							example, you can toggle individual movement paths and speakers, visualize conversation
							in different ways, animate data, and play/pause video by clicking anywhere on the
							timeline.
						</p>
						<p class="py-3">
							For further information, learn how to use and format your data for the IGS
						</p>
						<p class="pt-3 pb-6">
							IGS software is an open-source project built with JavaScript and p5.js licensed under
							the GNU General Public License Version 2.0. It is developed by Ben Rydal Shapiro and
							contributors with support from the National Science Foundation. Contribute | Reference
							| Learn More About Interaction Geography
						</p>
						<!-- <button class="btn btn-primary">Get Started</button> -->
						<div class="modal-action">
							<button class="btn btn-primary" on:click={() => ($isModalOpen = false)}>
								<label for="my-modal">Get Started</label>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
