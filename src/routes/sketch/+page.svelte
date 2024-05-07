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

<div class="drawer">
	<input id="my-drawer" type="checkbox" class="drawer-toggle" />
	<div class="navbar min-h-16 bg-[#f6f5f3] text-base-100">
		<div class="flex-1 px-2 lg:flex-none">
			<a class="text-lg font-bold" href="/">IGS</a>
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
				<select
					id="select-data-dropdown"
					class="select select-bordered w-full max-w-xs bg-[#f6f5f3] text-black"
					on:change={core.handleExampleDropdown}
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
		<div class="w-1/2 bg-[#f6f5f3]">
			<div class="join w-full flex items-center justify-start">
				<select bind:value={selectedTab} id="select-data-dropdown" class="select select-bordered max-w-xs bg-neutral text-white dropdown-top">
					{#each Constants.TAB_OPTIONS as value}<option {value}>{value}</option>{/each}
				</select>

				<div class="flex items-center w-full">
					<button
						class="btn flex-shrink-0"
						on:mousedown={() => startScrolling('left')}
						on:mouseup={stopScrolling}
						on:mouseleave={stopScrolling}
						on:touchstart={() => startScrolling('left')}
						on:touchend={stopScrolling}
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
					</button>

					<div class="carousel carousel-center overflow-x-auto flex-grow mx-5">
						{#if selectedTab == 'Movement'}
							{#each $UserStore as user}
								<div class="carousel-item inline-flex items-center mr-2">
									<div class="flex items-center">
										<input id="userCheckbox-{user.name}" type="checkbox" class="checkbox" bind:checked={user.enabled} />
										<label for="userCheckbox-{user.name}" class="flex items-center ml-1 mr-4">
											<!-- <div class="w-4 h-4 rounded-full mr-2" style="background-color: {user.color};" /> -->
											<input type="color" class="color-picker" bind:value={user.color} />
											{user.name}
										</label>
									</div>
								</div>
							{/each}
						{:else if selectedTab == 'Talk'}
							{#each $UserStore as user}
								{#if user.dataTrail.some((dp) => dp.speech)}
									<div class="carousel-item inline-flex items-center mr-2">
										<div class="flex items-center">
											<input id="userCheckbox-{user.name}" type="checkbox" class="checkbox" bind:checked={user.enabled} />
											<label for="userCheckbox-{user.name}" class="flex items-center ml-1 mr-4">
												<input type="color" class="color-picker" bind:value={user.color} />
												{user.name}
											</label>
											<button class="btn btn-sm" on:click={() => (showSpeechPopup[user.name] = !showSpeechPopup[user.name])}>View Speech</button>
										</div>
									</div>

									{#if showSpeechPopup[user.name]}
										<div class="modal modal-open">
											<div class="modal-box">
												<h3 class="font-bold text-lg">{user.name}'s Speech Datapoints</h3>
												<div class="overflow-x-auto">
													<table class="table w-full">
														<thead>
															<tr>
																<th>Time</th>
																<th>Speech</th>
															</tr>
														</thead>
														<tbody>
															{#each user.dataTrail
																.filter((dp) => dp.speech)
																.sort((a, b) => {
																	if (a.time === null && b.time === null) return 0;
																	if (a.time === null) return 1;
																	if (b.time === null) return -1;
																	return a.time - b.time;
																}) as datapoint}
																<tr>
																	<td>{datapoint.time}</td>
																	<td>{datapoint.speech}</td>
																</tr>
															{/each}
														</tbody>
													</table>
												</div>
												<div class="modal-action">
													<button class="btn" on:click={() => (showSpeechPopup[user.name] = false)}>Close</button>
												</div>
											</div>
										</div>
									{/if}
								{/if}
							{/each}
						{:else if selectedTab == 'Code'}
							{#each Array.from(new Set($UserStore.flatMap((user) => user.segments))) as code}
								<div class="carousel-item inline-flex items-center mr-2">
									<div class="flex items-center" />
								</div>
								<button class="btn btn-sm" on:click={() => (showCodePopup[code] = !showCodePopup[code])}>{code}</button>

								{#if showCodePopup[code]}
									<div class="modal modal-open">
										<div class="modal-box">
											<h3 class="font-bold text-lg">Code: {code}</h3>
											<div class="overflow-x-auto">
												<table class="table w-full">
													<thead>
														<tr>
															<th>User</th>
															<th>Start Time</th>
															<th>End Time</th>
														</tr>
													</thead>
													<tbody>
														{#each $UserStore as user}
															{#each user.dataTrail as datapoint}
																{#if datapoint.codes && datapoint.codes[code]}
																	<tr>
																		<td>{user.name}</td>
																		<td>{datapoint.time}</td>
																		<!-- <td>{datapoint.time + datapoint.stopLength}</td> -->
																	</tr>
																{/if}
															{/each}
														{/each}
													</tbody>
												</table>
											</div>
											<div class="modal-action">
												<button class="btn" on:click={() => (showCodePopup[code] = false)}>Close</button>
											</div>
										</div>
									</div>
								{/if}
							{/each}
						{/if}
					</div>

					<button
						class="btn flex-shrink-0"
						on:mousedown={() => startScrolling('right')}
						on:mouseup={stopScrolling}
						on:mouseleave={stopScrolling}
						on:touchstart={() => startScrolling('right')}
						on:touchend={stopScrolling}
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>
			</div>
		</div>

		<!-- Right Side: Timeline -->
		<div class="w-1/2 overflow-x-auto bg-[#f6f5f3]">
			<!-- <div style="width: 800px; height: 50px; background: linear-gradient(to right, #eee, #ddd);"> -->
			<!-- TODO: Timeline logic -->
			<TimelinePanel />
			<!-- </div> -->
		</div>
	</div>

	<slot />
</div>

<IgsInfoModal {isModalOpen} />

<style>
	.navbar {
		height: 64px;
	}

	.btm-nav {
		height: 100px;
	}

	.color-picker {
		width: 30px;
		height: 30px;
		border: none;
		border-radius: 50%;
		cursor: pointer;
	}
</style>
