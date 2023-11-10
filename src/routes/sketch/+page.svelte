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

	import * as Constants from '../../lib/constants';

	import { Core } from '$lib';
	import { igsSketch } from '$lib/p5/igsSketch';
	import { writable } from 'svelte/store';
	import IconButton from '$lib/components/IconButton.svelte';
	import IgsInfoModal from '$lib/components/IGSInfoModal.svelte';

	let isModalOpen = writable(false);

	let files: any = [];
	let users: User[] = [];
	let p5Instance: p5 | null = null;
	let selectedTab: string = 'Movement';
	let core: Core;

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

					<input class="hidden" id="file-input" type="file" bind:files />
					<!-- on:change={(event) => handleFileSelect(event)} -->
					<!-- <IconButton icon={MdHelpOutline} /> -->
					<IconButton icon={MdHelpOutline} on:click={() => ($isModalOpen = !$isModalOpen)} />

					<IconButton id="btn-toggle-3d" icon={Md3DRotation} />
					<select
						id="select-data-dropdown"
						class="select select-bordered w-full max-w-xs bg-neutral"
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
										on:change={core.handleCheckboxChange}
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
			<div class="w-1/2 overflow-x-auto">
				<div style="width: 800px; height: 50px; background: linear-gradient(to right, #eee, #ddd);">
					<!-- TODO: Timeline logic -->
				</div>
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
