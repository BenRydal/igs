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
	import { onMount, onDestroy } from 'svelte';
	import MdChevronLeft from 'svelte-icons/md/MdChevronLeft.svelte';
	import MdChevronRight from 'svelte-icons/md/MdChevronRight.svelte';

	import type { User } from '../../models/user';

	import UserStore from '../../stores/userStore';
	import P5Store from '../../stores/p5Store';
	import VideoStore from '../../stores/videoStore';

	import { Core } from '$lib';
	import { igsSketch } from '$lib/p5/igsSketch';
	import { writable } from 'svelte/store';
	import IconButton from '$lib/components/IconButton.svelte';
	import IgsInfoModal from '$lib/components/IGSInfoModal.svelte';
	import TimelinePanel from '$lib/components/TimelinePanel.svelte';
	import DataPointTable from '$lib/components/DataPointTable.svelte';

	import CodeStore from '../../stores/codeStore';
	import ConfigStore from '../../stores/configStore';

	let showDataPopup = false;
	let expandedUsers: { [key: string]: boolean } = {};
	let stopLength = 300;

	function toggleUserExpansion(userName: string) {
		expandedUsers[userName] = !expandedUsers[userName];
	}

	let files: any = [];
	let users: User[] = [];
	let p5Instance: p5 | null = null;
	let core: Core;
	let isVideoShowing = false;
	let isVideoPlaying = false;
	let isPathColorMode = false;

	ConfigStore.subscribe((value) => {
		isPathColorMode = value.isPathColorMode;
	});

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

	function capitalizeEachWord(sentence: string) {
		return sentence
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	}
</script>

<div class="navbar min-h-16 bg-[#f6f5f3] text-base-100">
	<div class="flex-1 px-2 lg:flex-none">
		<a class="text-lg font-bold text-black" href="/">IGS</a>
	</div>

	<div class="flex justify-end flex-1 px-2">
		<div class="dropdown">
			<div tabindex="0" role="button" class="btn m-1">Click</div>
			<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
				<li><a>Circle</a></li>
				<li><a>Slice</a></li>
				<li><a>Movement</a></li>
				<li><a>Stops</a></li>
				<li><a>Highlight</a></li>
				<li><a>Reset</a></li>
				<span class="divider" />
				<li class="cursor-none"><p>Stop Length: {stopLength}</p></li>
				<input type="range" min="0" max="100" value="40" class="range" />
			</ul>
		</div>

		<button class="btn btn-sm ml-4" on:click={() => (showDataPopup = true)}>Show Data</button>

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
		<div class="modal-box w-11/12 max-w-5xl">
			<div class="flex justify-between">
				<div class="flex flex-col">
					<h3 class="font-bold text-lg">Data Explorer</h3>
					<p>
						Here you will find information on the data that you have uploaded. This includes the codes that have been used, and the users that have
						been tracked. You can also enable or disable the movement and speech of each user, and change the color of their path.
					</p>
				</div>

				<button class="btn btn-circle btn-sm" on:click={() => (showDataPopup = false)}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="overflow-x-auto">
				<div class="flex flex-col">
					<div class="flex-col my-4">
						<h4 class="font-bold my-2">Codes:</h4>
						<div class="grid grid-cols-5 gap-4">
							{#each $CodeStore as code}
								<div class="badge badge-neutral">{code.code}</div>
							{/each}
						</div>
					</div>

					<h4 class="font-bold">Users:</h4>
					{#each $UserStore as user}
						<div class="my-4">
							<div tabindex="0" class="text-primary-content bg-[#e6e4df] collapse" aria-controls="collapse-content-{user.name}" role="button">
								<input type="checkbox" class="peer" />
								<div class="collapse-title font-semibold">{capitalizeEachWord(user.name)}</div>

								<div class="collapse-content">
									<div class="flex flex-col">
										<div class="flex">
											<h2 class="font-medium">Color:</h2>
											<!-- TODO: Set badge colour to be user colour -->
											<div class="badge ml-2">{user.color}</div>
										</div>
										<div class="flex">
											<h2 class="font-medium">Enabled</h2>
											{#if user.enabled}
												<div class="badge badge-success ml-2">{user.enabled}</div>
											{:else}
												<div class="badge badge-error ml-2">{user.enabled}</div>
											{/if}
										</div>
									</div>
									<h2 class="font-medium">Data Points:</h2>
									<DataPointTable dataPoints={user.dataTrail} />
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
			<div class="modal-action">
				<button class="btn" on:click={() => (showDataPopup = false)}>Close</button>
			</div>
		</div>
	</div>
{/if}

<div class="btm-nav flex justify-between min-h-20">
	<div class="w-1/2 overflow-x-overflow bg-[#f6f5f3] items-start px-8">
		<div class="flex space-x-4">
			{#if $ConfigStore.dataHasCodes}
				<div class="dropdown dropdown-top">
					<div tabindex={0} role="button" class="btn">Codes</div>
					<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
						<li>
							<div class="flex items-center">
								<input id="codeCheckbox-all" type="checkbox" class="checkbox" />
								Select All
							</div>
							<div class="flex items-center">
								<!-- This updates the config store's isPathColorMode -->
								<input id="codeCheckbox-all" type="checkbox" class="checkbox" bind:checked={$ConfigStore.isPathColorMode} />
								Color by Codes
							</div>
						</li>
						{#each $CodeStore as code, index}
							<li><h3 class="pointer-events-none">{code.code.toUpperCase()}</h3></li>
							<li>
								<div class="flex items-center">
									<input id="codeCheckbox-{code.code}" type="checkbox" class="checkbox" bind:checked={code.enabled} />
									Enabled
								</div>
							</li>
							<li>
								<div class="flex items-center">
									<input type="color" class="color-picker max-w-[24px] max-h-[28px]" bind:value={code.color} />
									Color
								</div>
							</li>
							{#if index !== $CodeStore.length - 1}
								<div class="divider" />
							{/if}
						{/each}
					</ul>
				</div>
			{/if}
			{#each $UserStore as user}
				<div class="dropdown dropdown-top">
					<div tabindex={0} role="button" class="btn">{user.name}</div>
					<ul tabindex={0} class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
						<li>
							<div class="flex items-center">
								<input id="userCheckbox-{user.name}" type="checkbox" class="checkbox" bind:checked={user.enabled} />
								Movement
							</div>
						</li>
						<li>
							<div class="flex items-center">
								<input id="userCheckbox-{user.name}" type="checkbox" class="checkbox" bind:checked={user.conversation_enabled} />
								Speech
							</div>
						</li>
						<li>
							<div class="flex items-center">
								<input type="color" class="color-picker max-w-[24px] max-h-[28px]" bind:value={user.color} />
								Color
							</div>
						</li>
						<li>
							<div class="flex items-center">Transcripts</div>
							<!-- this should go through the user's datatrail and then show a daisyui table of all the text -->
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
