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
						<p class="py-3 text-xl text-justify">
							Welcome to the Interaction Geography Slicer! The IGS is an open-source tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan and
							a timeline in 2D and 3D views. Use the top menu to explore sample datasets or upload your own data. Interact with data by visualizing movement and conversation in different ways, animating
							and filtering data, watching video, and rescaling data with the interactive timeline.
						</p>
						<div class="flex flex-row justify-center flex-wrap gap-4 my-2">
							<a href="https://www.youtube.com/watch?v=smoxv9AspHA" target="_blank" class="btn bg-gray-300 text-black">Watch Demo Video</a>
							<a href="/images/data_formatting_guide.pdf" target="_blank" class="btn bg-gray-300 text-black">Data Formatting Guide</a>
							<a href="https://journals.sagepub.com/doi/abs/10.3102/0013189X241238698" target="_blank" class="btn bg-gray-300 text-black">View Publication</a>
							<a href="https://forms.gle/M1gvdgSvdH9yXAABA" target="_blank" class="btn bg-gray-300 text-black">Share Feedback</a>
						</div>

						<p class="pt-3 pb-2 text-justify">
							IGS software is an <a href="https://github.com/BenRydal/igs" class="text-blue-500 underline" target="_blank" rel="noopener noreferrer">open-source project</a>
							licensed under the GNU General Public License Version 3.0. It is
							developed by Ben Rydal Shapiro, Edwin Zhao and contributors with support from the National Science Foundation #1623690 and #2100784.
							Example data is from the <a href="https://www.timssvideo.com" class="text-blue-500 underline" target="_blank">TIMSS 1999 Video Study</a> and 
							<a href="https://deepblue.lib.umich.edu/handle/2027.42/65013" class="text-blue-500 underline" target="_blank">the Case of Sean Numbers</a> from Mathematics Teaching and Learning to Teach (MTLT), University of Michigan (2010) used with special permission.
							If using the IGS in your research, kindly reference: 
						</p>
						<p class="pt-1 pb-6 italic text-justify">
							Shapiro, B.R., Metts, E., & Zhao, E. (2025). The Interaction Geography Slicer: 
							Designing Exploratory Spatial Data Visualization Tools for Teachers’ Reflective Practice. In CHI Conference on Human Factors in 
							Computing Systems (CHI ’25), April 26–May 01, 2025, Yokohama, Japan. ACM, New York, NY, USA, 17 pages. 
							<a href="https://doi.org/10.1145/3706598.3713499" class="text-blue-500 underline" target="_blank">https://doi.org/10.1145/3706598.3713499</a>
						</p>
						<div class="modal-action flex justify-center">
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
