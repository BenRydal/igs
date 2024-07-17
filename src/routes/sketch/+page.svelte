<script lang="ts">
	import P5, { type Sketch } from 'p5-svelte';
	import type p5 from 'p5';
	import MdHelpOutline from 'svelte-icons/md/MdHelpOutline.svelte';
	import MdCloudUpload from 'svelte-icons/md/MdCloudUpload.svelte';
	import MdCloudDownload from 'svelte-icons/md/MdCloudDownload.svelte';
	import MdRotateLeft from 'svelte-icons/md/MdRotateLeft.svelte';
	import MdRotateRight from 'svelte-icons/md/MdRotateRight.svelte';
	import Md3DRotation from 'svelte-icons/md/Md3DRotation.svelte';
	import MdVideocam from 'svelte-icons/md/MdVideocam.svelte';
	import MdVideocamOff from 'svelte-icons/md/MdVideocamOff.svelte';

	import type { User } from '../../models/user';

	import UserStore from '../../stores/userStore';
	import P5Store from '../../stores/p5Store';
	import VideoStore from '../../stores/videoStore';

	import * as Constants from '../../lib/constants';

	import { Core } from '$lib';
	import { igsSketch } from '$lib/p5/igsSketch';
	import { writable } from 'svelte/store';
	import IconButton from '$lib/components/IconButton.svelte';
	import IgsInfoModal from '$lib/components/IGSInfoModal.svelte';
	import TimelinePanel from '$lib/components/TimelinePanel.svelte';
	import DataPointTable from '$lib/components/DataPointTable.svelte';

	import CodeStore from '../../stores/codeStore';

	let showDataPopup = false;
	let expandedUsers: { [key: string]: boolean } = {};

	function toggleUserExpansion(userName: string) {
		expandedUsers[userName] = !expandedUsers[userName];
	}

	let files: any = [];
	let users: User[] = [];
	let p5Instance: p5 | null = null;
	let selectedTab: string = 'Movement';
	let core: Core;
	let isVideoShowing = false;
	let isVideoPlaying = false;

	VideoStore.subscribe((value) => {
		isVideoShowing = value.isShowing;
		isVideoPlaying = value.isPlaying;
	});

	UserStore.subscribe((data) => {
		users = data;
	});

	P5Store.subscribe((value) => {
		p5Instance = value;

		if (p5Instance) {
			core = new Core(p5Instance);
		}
	});

	const sketch: Sketch = (p5: p5) => {
		igsSketch(p5);
	};

	let isModalOpen = writable(false);
	let showSpeechPopup: { [key: string]: boolean } = {};
	let showCodePopup: { [code: string]: boolean } = {};

	let scrollInterval: ReturnType<typeof setInterval> | null = null;

	function startScrolling(direction: 'left' | 'right'): void {
		const carousel = document.querySelector('.carousel');
		if (carousel) {
			const scrollAmount = direction === 'left' ? -100 : carousel.clientWidth + 80;
			scrollInterval = setInterval(() => {
				carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
			}, 5); // Adjust the interval time (100 ms) as needed
		}
	}

	function stopScrolling(): void {
		if (scrollInterval) {
			clearInterval(scrollInterval);
			scrollInterval = null;
		}
	}

	function toggleVideo() {
		if (p5Instance && p5Instance.videoController) {
			p5Instance.videoController.toggleShowVideo();
			VideoStore.update((value) => {
				value.isShowing = p5Instance.videoController.isShowing;
				value.isPlaying = p5Instance.videoController.isPlaying;
				return value;
			});
		}
	}
</script>

<div class="navbar min-h-16 bg-[#f6f5f3] text-base-100">
	<div class="flex-1 px-2 lg:flex-none">
		<a class="text-lg font-bold" href="/">IGS</a>
		<button class="btn btn-sm ml-4" on:click={() => (showDataPopup = true)}>Show Data</button>
	</div>

	<div class="flex justify-end flex-1 px-2">
		<div class="flex items-stretch">
			<IconButton
				id="btn-rotate-left"
				icon={MdRotateLeft}
				tooltip={'Rotate Left'}
				on:click={() => {
					p5Instance.floorPlan.setRotateLeft();
					p5Instance.loop();
				}}
			/>

			<IconButton
				id="btn-rotate-left"
				icon={MdRotateRight}
				tooltip={'Rotate Right'}
				on:click={() => {
					p5Instance.floorPlan.setRotateRight();
					p5Instance.loop();
				}}
			/>

			<IconButton icon={MdCloudDownload} tooltip={'Download your Data'} />
			<div
				data-tip="Upload"
				class="tooltip tooltip-bottom btn capitalize icon max-h-8 bg-[#f6f5f3] border-[#f6f5f3]"
				role="button"
				tabindex="0"
				on:click
				on:keydown
			>
				<label for="file-input">
					<MdCloudUpload />
				</label>
			</div>

			<input
				class="hidden"
				id="file-input"
				multiple
				accept=".png, .jpg, .jpeg, .csv, .mp4"
				type="file"
				bind:files
				on:change={core.handleUserLoadedFiles}
			/>

			<IconButton icon={MdHelpOutline} tooltip={'Help'} on:click={() => ($isModalOpen = !$isModalOpen)} />

			<IconButton
				id="btn-toggle-3d"
				icon={Md3DRotation}
				tooltip={'Toggle 3D'}
				on:click={() => {
					p5Instance.handle3D.update();
				}}
			/>

			{#if isVideoShowing}
				<IconButton id="btn-toggle-video" icon={MdVideocam} tooltip={'Show/Hide Video'} on:click={toggleVideo} />
			{:else}
				<IconButton id="btn-toggle-video" icon={MdVideocamOff} tooltip={'Show/Hide Video'} on:click={toggleVideo} />
			{/if}
			<select id="select-data-dropdown" class="select select-bordered w-full max-w-xs bg-[#f6f5f3] text-black" on:change={core.handleExampleDropdown}>
				<option disabled selected>-- Select an Example --</option>
				<option value="example-1">Michael Jordan's Last Shot</option>
				<option value="example-2">Family Museum Gallery Visit</option>
				<option value="example-3">Classroom Science Lesson</option>
				<option value="example-4">Classroom Discussion</option>
			</select>
		</div>
	</div>
</div>

<div class="h-10">
	<P5 {sketch} />
</div>

{#if showDataPopup}
	<div
		class="modal modal-open"
		on:click|self={() => (showDataPopup = false)}
		on:keydown={(e) => {
			if (e.key === 'Escape') showDataPopup = false;
		}}
	>
		<div class="modal-box relative">
			<button class="btn btn-sm btn-circle absolute right-2 top-2" on:click={() => (showDataPopup = false)}>
				<span class="material-symbols-outlined">close</span>
			</button>
			<h3 class="font-bold text-lg">Data</h3>
			<div class="overflow-x-auto">
				<h4 class="font-bold">Codes:</h4>
				<ul>
					{#each $CodeStore as code}
						<li>{code.code}</li>
					{/each}
				</ul>

				<h4 class="font-bold mt-4">Users:</h4>
				{#each $UserStore as user}
					<div class="mb-4">
						<button class="btn btn-sm" on:click={() => toggleUserExpansion(user.name)}>
							{user.name}
						</button>
						{#if expandedUsers[user.name]}
							<div class="ml-4">
								<p>Color: {user.color}</p>
								<p>Enabled: {user.enabled}</p>
								<h5 class="font-bold">Data Points:</h5>
								<DataPointTable dataPoints={user.dataTrail} />
							</div>
						{/if}
					</div>
				{/each}
			</div>
			<div class="modal-action">
				<button class="btn" on:click={() => (showDataPopup = false)}>Close</button>
			</div>
		</div>
	</div>
{/if}

<div class="btm-nav flex justify-between">
	<div class="w-1/2 overflow-x-overflow bg-[#f6f5f3]">
		<div class="flex space-x-4">
			{#each $UserStore as user}
				<div class="dropdown dropdown-top dropdown-end">
					<div tabindex={0} role="button" class="btn">{user.name}</div>
					<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
						<li>
							<div class="flex items-center">
								<input id="userCheckbox-{user.name}" type="checkbox" class="checkbox" bind:checked={user.enabled} />
								Enabled
							</div>
						</li>
						<li>
							<div class="flex items-center">
								<label for="userCheckbox-{user.name}" class="flex items-center ml-1 mr-4">
									<input type="color" class="color-picker" bind:value={user.color} />
									Color
								</label>
							</div>
						</li>
					</ul>
				</div>
			{/each}
		</div>
	</div>

	<!-- Right Side: Timeline -->
	<div class="w-1/2 overflow-x-auto bg-[#f6f5f3]">
		<TimelinePanel />
	</div>
</div>

<slot />

<IgsInfoModal {isModalOpen} />

<style>
	.navbar {
		height: 64px;
	}
	.color-picker {
		width: 30px;
		height: 30px;
		border: none;
		border-radius: 50%;
		cursor: pointer;
	}

	.modal-box {
		max-width: 50%;
	}

	.material-symbols-outlined {
		font-size: 18px;
	}
</style>
