<script lang="ts">
	import P5, { type Sketch } from 'p5-svelte';
	import type p5 from 'p5';
	import MdHelpOutline from 'svelte-icons/md/MdHelpOutline.svelte';
	import MdCloudUpload from 'svelte-icons/md/MdCloudUpload.svelte';
	import MdCloudDownload from 'svelte-icons/md/MdCloudDownload.svelte';
	import MdRotateLeft from 'svelte-icons/md/MdRotateLeft.svelte';
	import MdRotateRight from 'svelte-icons/md/MdRotateRight.svelte';
	import Md3DRotation from 'svelte-icons/md/Md3DRotation.svelte';

	import type { User } from '../../models/user';

	import UserStore from '../../stores/userStore';
	import P5Store from '../../stores/p5Store';
	import { get } from 'svelte/store';

	import * as Constants from '../../lib/constants';

	import type { Core } from '$lib/core';
	import { igsSketch } from '$lib/p5/igsSketch';
	import { writable } from 'svelte/store';
	import IconButton from '$lib/components/IconButton.svelte';
	import IgsInfoModal from '$lib/components/IGSInfoModal.svelte';
	import type { VideoController } from '$lib';
	import TimelinePanel from '$lib/components/TimelinePanel.svelte';

	let isModalOpen = writable(false);

	let files: any = [];
	let users: User[] = [];
	let selectedTab: string = 'Movement';

	let core: Core | null;
	let videoController: VideoController | null;

	$: {
		const state = get(P5Store);
		core = state.core;
		maxTime = core ? core.getTotalTimeInSeconds() : 100;
	}

	$: core = $P5Store.core;

	let minTime = 0;
	let maxTime = 100; // A default value that will be updated
	let currentTime = 0;

	$: {
			const state = get(P5Store);
			videoController = state.videoController;

			if (videoController) {
				maxTime = videoController.getVideoDuration(); // Assuming this method exists
				currentTime = videoController.getVideoPlayerCurTime(); // Adjusted method name
			}
    }
	// // If hovered then show the tooltip
	// let showTooltip: boolean = false;

	// // X coordinate for the tooltip position
	// let tooltipX: number = 0;

	UserStore.subscribe((data) => {
		users = data;
	});

	const sketch: Sketch = (p5: p5) => {
		igsSketch(p5);
	};

	function handleFileSelect(event: Event) {
		const state = get(P5Store);
		if (state.core) {
			state.core.handleFileSelect(event);
		}
	}

	function handleExampleDropdown(event: Event) {
		const state = get(P5Store);
		if (state.core) {
			state.core.handleExampleDropdown(event);
		}
	}

	function handle3D() {
		const state = get(P5Store);
		if (state.core) {
			state.core.handle3D();
		}
	}

	function handleCheckboxChange() {
		const state = get(P5Store);
		if (state.core) {
			state.core.handleCheckboxChange();
		}
	}
</script>

<div class="drawer">
	<input id="my-drawer" type="checkbox" class="drawer-toggle" />
	<div class="drawer-content">
		<!-- Page content here -->
		<div class="navbar min-h-16 bg-[#47606e] text-base-100">
			<div class="flex-1 px-2 lg:flex-none">
				<label for="my-drawer" class="btn btn-primary drawer-button">Open drawer</label>
			</div>
			<div class="flex justify-end flex-1 px-2">
				<div class="flex items-stretch">
					<IconButton icon={MdRotateLeft} />
					<IconButton icon={MdRotateRight} />
					<IconButton icon={MdCloudDownload} />
					<label class="btn icon max-h-8" for="file-input">
						<MdCloudUpload />
					</label>

					<input
						class="hidden"
						id="file-input"
						multiple
						accept=".png, .jpg, .jpeg, .csv, .mp4"
						type="file"
						bind:files
						on:change={(event) => handleFileSelect(event)}
					/>
					<IconButton icon={MdHelpOutline} />
					<IconButton icon={MdHelpOutline} on:click={() => ($isModalOpen = !$isModalOpen)} />

					<IconButton
						id="btn-toggle-3d"
						icon={Md3DRotation}
						on:click={() => {
							handle3D();
						}}
					/>
					<select
						id="select-data-dropdown"
						class="select select-bordered w-full max-w-xs bg-neutral"
						on:change={handleExampleDropdown}
					>
						<option disabled selected>-- Select an Example --</option>
						<option value="example-1">Michael Jordan's Last Shot</option>
						<option value="example-2">Family Museum Gallery Visit</option>
						<option value="example-3">Classroom Science Lesson</option>
						<option value="example-4">Classroom Discussion</option>
					</select>
				</div>
			</div>
		</div>

		<P5 {sketch} />

		<div class="btm-nav flex justify-between">
			<!-- Left Side: Select and Carousel -->
			<div class="w-1/2">
				<div class="join w-full flex items-center justify-start">
					<select
						bind:value={selectedTab}
						id="select-data-dropdown"
						class="select select-bordered max-w-xs bg-neutral text-white dropdown-top"
					>
						{#each Constants.TAB_OPTIONS as value}<option {value}>{value}</option>{/each}
					</select>

					<div class="carousel carousel-center flex mx-5 align-middle">
						{#if selectedTab == 'Movement'}
							{#each $UserStore as user}
								<div class="carousel-item align-middle inline-flex items-center">
									<input
										id="userCheckbox"
										type="checkbox"
										class="checkbox"
										bind:checked={user.enabled}
										on:change={handleCheckboxChange}
									/>
									<!-- Call the loop directly rather than wrapping with handleCheckboxChange -->
									<label class="m-5" for="userCheckbox">{user.name}</label>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>

			<!-- Right Side: Timeline -->
			<div class="relative p-4 bg-gray-100">
				<!-- Progress bar -->
				<!-- <div class="w-full bg-white">
					<input type="range" min={minTime} max={maxTime} bind:value={currentTime} class="range" />
					<span class="material-symbols-outlined cursor-pointer">play_arrow</span>
				</div> -->
				<TimelinePanel></TimelinePanel>
			</div>
		</div>

		<slot />
	</div>
	<div class="drawer-side">
		<label for="my-drawer" class="drawer-overlay" />
		<ul class="menu p-4 w-80 bg-base-100 text-base-content">
			<!-- Sidebar content here -->
			<li>Movement</li>
			<li>Talk</li>
			<li>Video</li>
			<li>Select</li>
			<li>Codes</li>
			<li>Export</li>
			<li>2D</li>
			<li>3D</li>
		</ul>
	</div>
</div>

<IgsInfoModal {isModalOpen} />