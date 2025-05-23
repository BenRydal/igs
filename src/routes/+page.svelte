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
	import MdCheck from 'svelte-icons/md/MdCheck.svelte';
	import MdSettings from 'svelte-icons/md/MdSettings.svelte';

	import type { User } from '../models/user';

	import UserStore from '../stores/userStore';
	import P5Store from '../stores/p5Store';
	import VideoStore from '../stores/videoStore';

	import { Core } from '$lib';
	import { igsSketch } from '$lib/p5/igsSketch';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	import IgsInfoModal from '$lib/components/IGSInfoModal.svelte';
	import TimelinePanel from '$lib/components/TimelinePanel.svelte';
	import DataPointTable from '$lib/components/DataPointTable.svelte';

	import CodeStore from '../stores/codeStore';
	import ConfigStore from '../stores/configStore';
	import type { ConfigStoreType } from '../stores/configStore';
	import TimelineStore from '../stores/timelineStore';
	import { initialConfig } from '../stores/configStore';
import { computePosition, flip, shift, offset, autoUpdate } from '@floating-ui/dom';

// Define ToggleKey type to fix TypeScript errors
type ToggleKey = string;

// Floating UI references
type FloatingElement = {
	button: HTMLElement | null;
	content: HTMLElement | null;
	cleanup: (() => void) | null;
	isOpen: boolean;
};

// Store references to floating elements
const floatingElements: Record<string, FloatingElement> = {};

// Function to position a floating element
function positionFloatingElement(reference: HTMLElement, floating: HTMLElement) {
	return computePosition(reference, floating, {
		placement: 'top',
		middleware: [
			offset(6),
			flip(),
			shift({ padding: 5 })
		]
	}).then(({ x, y }) => {
		Object.assign(floating.style, {
			left: `${x}px`,
			top: `${y}px`,
			position: 'absolute',
			width: 'max-content',
			zIndex: '100'
		});
	});
}

// Function to toggle a floating element
function toggleFloating(id: string) {
	const element = floatingElements[id];
	if (!element || !element.button || !element.content) return;

	element.isOpen = !element.isOpen;

	if (element.isOpen) {
		// Show the floating element
		element.content.style.display = 'block';
		document.body.appendChild(element.content);

		// Position it initially
		positionFloatingElement(element.button, element.content);

		// Set up auto-update to reposition on scroll/resize
		element.cleanup = autoUpdate(
			element.button,
			element.content,
			() => positionFloatingElement(element.button, element.content)
		);

		// Add click outside listener
		const handleClickOutside = (event: MouseEvent) => {
			if (
				element.content &&
				element.button &&
				!element.content.contains(event.target as Node) &&
				!element.button.contains(event.target as Node)
			) {
				toggleFloating(id);
			}
		};

		document.addEventListener('click', handleClickOutside);

		// Update cleanup to include removing the event listener
		const prevCleanup = element.cleanup;
		element.cleanup = () => {
			prevCleanup?.();
			document.removeEventListener('click', handleClickOutside);
		};
	} else {
		// Hide the floating element
		if (element.content) {
			element.content.style.display = 'none';
		}

		// Clean up auto-update
		if (element.cleanup) {
			element.cleanup();
			element.cleanup = null;
		}
	}
}

// Function to register a floating element
function registerFloating(id: string, button: HTMLElement, content: HTMLElement) {
	floatingElements[id] = {
		button,
		content,
		cleanup: null,
		isOpen: false
	};

	// Initially hide the content
	content.style.display = 'none';
}

	const filterToggleOptions = ['movementToggle', 'stopsToggle'] as const;
	const selectToggleOptions = ['circleToggle', 'sliceToggle', 'highlightToggle'] as const;
	const conversationToggleOptions = ['alignToggle'] as const;
	let selectedDropDownOption = '';
	const dropdownOptions = [
		{ label: 'Sports', items: [{ value: 'example-1', label: "Michael Jordan's Last Shot" }] },
		{ label: 'Museums', items: [{ value: 'example-2', label: 'Family Gallery Visit' }] },
		{
			label: 'Classrooms',
			items: [
				{ value: 'example-3', label: 'Classroom Science Lesson' },
				{ value: 'example-4', label: 'Classroom Discussion' }
			]
		},
		{
			label: 'TIMSS 1999 Video Study',
			items: [
				{ value: 'example-3', label: 'U.S. Science Lesson (weather)' },
				{ value: 'example-5', label: 'Czech Republic Science Lesson (density)' },
				{ value: 'example-6', label: 'Japan Math Lesson (angles)' },
				{ value: 'example-7', label: 'U.S. Math Lesson (linear equations)' },
				{ value: 'example-8', label: 'U.S. Science Lesson (rocks)' },
				{ value: 'example-9', label: 'Netherlands Math Lesson (pythagorean theorem)' }
			]
		}
	];

	let showDataPopup = false;
	let showSettings = false;
	let showDataDropDown = false;
	let currentConfig: ConfigStoreType;

	let files: any = [];
	let users: User[] = [];
	let p5Instance: p5 | null = null;
	let core: Core;
	let isVideoShowing = false;
	let isVideoPlaying = false;
	let timeline;

	ConfigStore.subscribe((value) => {
		currentConfig = value;
	});

	TimelineStore.subscribe((value) => {
		timeline = value;
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

	let isModalOpen = writable(true);

	$: sortedCodes = [...$CodeStore].sort((a, b) => {
		if (a.code.toLowerCase() === 'no codes') return 1;
		if (b.code.toLowerCase() === 'no codes') return -1;
		return a.code.localeCompare(b.code);
	});

	$: formattedStopLength = $ConfigStore.stopSliderValue.toFixed(0);

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

	function resetSettings() {
		ConfigStore.update(() => ({ ...initialConfig }));

		if (p5Instance) {
			p5Instance.loop();
		}
	}

	function capitalizeEachWord(sentence: string) {
		return sentence
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	}

	// TODO: Sync this with the capitalizeEachWord function
	function capitalizeFirstLetter(string: string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	function handleConfigChangeFromInput(e: Event, key: keyof ConfigStoreType) {
		const target = e.target as HTMLInputElement;
		ConfigStore.update((value) => ({ ...value, [key]: parseFloat(target.value) }));
		p5Instance?.loop(); // Trigger redraw
	}

	function handleConfigChange(key: keyof ConfigStoreType, value: any) {
		ConfigStore.update((store) => ({ ...store, [key]: value }));
		p5Instance?.loop();
	}

	function toggleSelection(selection: ToggleKey, toggleOptions: ToggleKey[]) {
		ConfigStore.update((store: ConfigStoreType) => {
			const updatedStore = { ...store };
			toggleOptions.forEach((key) => {
				if (key.endsWith('Toggle')) {
					updatedStore[key] = key === selection ? !updatedStore[key] : false;
				}
			});
			p5Instance?.loop();
			return updatedStore;
		});
		p5Instance?.loop();
	}

	function toggleSelectAllCodes() {
		const allEnabled = $CodeStore.every((code) => code.enabled);
		CodeStore.update((codes) => codes.map((code) => ({ ...code, enabled: !allEnabled })));
		p5Instance.loop();
	}

	function clickOutside(node) {
		const handleClick = (event) => {
			if (!node.contains(event.target)) {
				node.removeAttribute('open');
			}
		};

		document.addEventListener('click', handleClick, true);

		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}

	function updateUserLoadedFiles(event) {
		//clearAllData();
		core.handleUserLoadedFiles(event);
		p5Instance.loop();
	}

	function updateExampleDataDropDown(event) {
		clearAllData();
		core.handleExampleDropdown(event);
		p5Instance.loop();
	}

function clearAllData() {
	console.log('Clearing all data');
	p5Instance.videoController.clear();
	currentConfig.isPathColorMode = false;

	// Close all floating elements before clearing data
	Object.keys(floatingElements).forEach(id => {
		if (floatingElements[id].isOpen) {
			toggleFloating(id);
		}
	});

	// Clear all floating elements
	Object.keys(floatingElements).forEach(id => {
		const element = floatingElements[id];
		if (element.cleanup) {
			element.cleanup();
		}
		if (element.content && element.content.parentNode) {
			element.content.parentNode.removeChild(element.content);
		}
		delete floatingElements[id];
	});

	closeAllDropdowns();

	UserStore.update(() => {
		return [];
	});

	CodeStore.update(() => {
		return [];
	});

	core.codeData = [];
	core.movementData = [];
	core.conversationData = [];

	ConfigStore.update((currentConfig) => ({ ...currentConfig, dataHasCodes: false }));
	p5Instance.loop();
}

	function clearMovementData() {
		UserStore.update(() => []);
		core.movementData = [];
		p5Instance.loop();
	}

	function clearConversationData() {
		UserStore.update((users) =>
			users.map((user) => {
				user.conversationIsLoaded = false;
				user.dataTrail = user.dataTrail.map((dataPoint) => {
					dataPoint.speech = '';
					return dataPoint;
				});
				return user;
			})
		);
		core.conversationData = [];
		p5Instance.loop();
	}

	function clearCodeData() {
		CodeStore.update(() => {
			return [];
		});
		core.codeData = [];
		UserStore.update((users) =>
			users.map((user) => {
				user.dataTrail = user.dataTrail.map((dataPoint) => {
					dataPoint.codes = [];
					return dataPoint;
				});
				return user;
			})
		);

		ConfigStore.update((currentConfig) => ({ ...currentConfig, dataHasCodes: false }));
		p5Instance.loop();
	}

	function handleWordSearch(event) {
		const newWord = event.target.value.trim();
		ConfigStore.update((config) => ({ ...config, wordToSearch: newWord }));
		// Trigger a redraw of the P5 sketch
		if (p5Instance) {
			p5Instance.loop();
		}
	}

	// Track which dropdown is currently open
	let openDropdownId: string | null = null;

	function closeAllDropdowns() {
		// If no dropdown is open, do nothing
		if (!openDropdownId) return;

		// Get the currently open dropdown
		const dropdown = document.getElementById(openDropdownId);
		if (dropdown) {
			dropdown.classList.add('hidden');

			// If it's in the body, move it back to its original position
			if (dropdown.parentNode === document.body) {
				const parentId = openDropdownId.replace('dropdown-', 'dropdown-container-');
				const parent = document.getElementById(parentId);
				if (parent) {
					parent.appendChild(dropdown);
				}
			}
		}

		openDropdownId = null;
	}

	function toggleDropdown(id: string, buttonId: string) {
		const dropdown = document.getElementById(id);
		const button = document.getElementById(buttonId);

		if (!dropdown || !button) return;

		const isCurrentlyOpen = openDropdownId === id;

		// Close all dropdowns first
		closeAllDropdowns();

		// If this dropdown wasn't already open, open it
		if (!isCurrentlyOpen) {
			// Show the dropdown
			dropdown.classList.remove('hidden');

			// Move dropdown to body to avoid clipping by overflow
			document.body.appendChild(dropdown);

			// Position the dropdown using Floating UI
			computePosition(button, dropdown, {
				placement: 'top',
				middleware: [
					offset(6),
					flip(),
					shift({ padding: 5 })
				]
			}).then(({x, y}) => {
				Object.assign(dropdown.style, {
					left: `${x}px`,
					top: `${y}px`,
					position: 'absolute',
					zIndex: '9999' // Higher z-index to ensure it's above canvas
				});
			});

			openDropdownId = id;
		}
	}

	// Add event handlers for dropdowns
	onMount(() => {
		// Add global click handler to close dropdowns when clicking outside
		document.addEventListener('click', (event) => {
			const target = event.target as HTMLElement;
			const isButton = document.getElementById('btn-codes')?.contains(target) ||
				Array.from($UserStore).some(user => {
					const button = document.getElementById(`btn-${user.name}`);
					return button && button.contains(target);
				});

			const isInsideDropdown = document.getElementById('dropdown-codes')?.contains(target) ||
				Array.from($UserStore).some(user => {
					const dropdown = document.getElementById(`dropdown-${user.name}`);
					return dropdown && dropdown.contains(target);
				});

			if (!isButton && !isInsideDropdown) {
				closeAllDropdowns();
			}
		});

		// Add scroll handler to close dropdowns when scrolling
		const userContainer = document.querySelector('.btm-nav .overflow-x-auto');
		if (userContainer) {
			userContainer.addEventListener('scroll', () => {
				closeAllDropdowns();
			});
		}
	});
</script>

<svelte:head>
	<title>IGS</title>
</svelte:head>

<div class="navbar min-h-16 bg-[#ffffff]">
	<div class="flex-1 px-2 lg:flex-none">
		<a class="text-2xl font-bold text-black italic" href="https://interactiongeography.org">IGS</a>
	</div>

	<div class="flex justify-end flex-1 px-2">
		<details class="dropdown" use:clickOutside>
			<summary class="btn btn-sm ml-4 tooltip tooltip-bottom flex items-center justify-center"> Filter </summary>
			<ul class="menu dropdown-content rounded-box z-[1] w-52 p-2 shadow bg-base-100">
				{#each filterToggleOptions as toggle}
					<li>
						<button on:click={() => toggleSelection(toggle, filterToggleOptions)} class="w-full text-left flex items-center">
							<div class="w-4 h-4 mr-2">
								{#if $ConfigStore[toggle]}
									<MdCheck />
								{/if}
							</div>
							{capitalizeFirstLetter(toggle.replace('Toggle', ''))}
						</button>
					</li>
				{/each}
				<li class="cursor-none">
					<p>Stop Length: {formattedStopLength} sec</p>
				</li>
				<li>
					<label for="stopLengthRange" class="sr-only">Adjust stop length</label>
					<input
						id="stopLengthRange"
						type="range"
						min="1"
						max={$ConfigStore.maxStopLength}
						value={$ConfigStore.stopSliderValue}
						class="range"
						on:input={(e) => handleConfigChangeFromInput(e, 'stopSliderValue')}
					/>
				</li>
			</ul>
		</details>

		<!-- Select Dropdown -->
		<details class="dropdown" use:clickOutside>
			<summary class="btn btn-sm ml-4 tooltip tooltip-bottom flex items-center justify-center"> Select </summary>
			<ul class="menu dropdown-content rounded-box z-[1] w-52 p-2 shadow bg-base-100">
				{#each selectToggleOptions as toggle}
					<li>
						<button on:click={() => toggleSelection(toggle, selectToggleOptions)} class="w-full text-left flex items-center">
							<div class="w-4 h-4 mr-2">
								{#if $ConfigStore[toggle]}
									<MdCheck />
								{/if}
							</div>
							{capitalizeFirstLetter(toggle.replace('Toggle', ''))}
						</button>
					</li>
				{/each}
			</ul>
		</details>

		<!-- Talk Dropdown -->
		<details class="dropdown" use:clickOutside>
			<summary class="btn btn-sm ml-4 tooltip tooltip-bottom flex items-center justify-center"> Talk </summary>
			<ul class="menu dropdown-content rounded-box z-[1] w-52 p-2 shadow bg-base-100">
				{#each conversationToggleOptions as toggle}
					<li>
						<button on:click={() => toggleSelection(toggle, conversationToggleOptions)} class="w-full text-left flex items-center">
							<div class="w-4 h-4 mr-2">
								{#if $ConfigStore[toggle]}
									<MdCheck />
								{/if}
							</div>
							{capitalizeFirstLetter(toggle.replace('Toggle', ''))}
						</button>
					</li>
				{/each}
				<li class="cursor-none">
					<p>Rect width: {$ConfigStore.conversationRectWidth} pixels</p>
				</li>
				<li>
					<label for="rectWidthRange" class="sr-only">Adjust rect width</label>
					<input
						id="rectWidthRange"
						type="range"
						min="1"
						max="30"
						value={$ConfigStore.conversationRectWidth}
						class="range"
						on:input={(e) => handleConfigChangeFromInput(e, 'conversationRectWidth')}
					/>
				</li>
				<input type="text" placeholder="Search conversations..." on:input={(e) => handleWordSearch(e)} class="input input-bordered w-full" />
			</ul>
		</details>

		<!-- Clear Data Dropdown -->
		<details class="dropdown" use:clickOutside>
			<summary class="btn btn-sm ml-4 tooltip tooltip-bottom flex items-center justify-center"> Clear </summary>
			<ul class="menu dropdown-content rounded-box z-[1] w-52 p-2 shadow bg-base-100">
				<li><button on:click={clearMovementData}>Movement</button></li>
				<li><button on:click={clearConversationData}>Conversation</button></li>
				<li><button on:click={clearCodeData}>Codes</button></li>
				<li><button on:click={() => p5Instance.videoController.clear()}>Video</button></li>
				<li><button on:click={clearAllData}>All Data</button></li>
			</ul>
		</details>

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

			<IconButton
				id="btn-toggle-3d"
				icon={Md3DRotation}
				tooltip={'Toggle 2D/3D'}
				on:click={() => {
					p5Instance.handle3D.update();
				}}
			/>

			{#if isVideoShowing}
				<IconButton id="btn-toggle-video" icon={MdVideocam} tooltip={'Show/Hide Video'} on:click={toggleVideo} />
			{:else}
				<IconButton id="btn-toggle-video" icon={MdVideocamOff} tooltip={'Show/Hide Video'} on:click={toggleVideo} />
			{/if}

			<IconButton icon={MdCloudDownload} tooltip={'Download Code File'} on:click={() => p5Instance.saveCodeFile()} />
			<!-- TODO: Need to move this logic into the IconButton component eventually -->
			<div
				data-tip="Upload"
				class="tooltip tooltip-bottom btn capitalize icon max-h-8 max-w-16 bg-[#ffffff] border-[#ffffff] flex items-center justify-center"
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
				on:change={updateUserLoadedFiles}
			/>

			<IconButton icon={MdHelpOutline} tooltip={'Help'} on:click={() => ($isModalOpen = !$isModalOpen)} />

			<IconButton icon={MdSettings} tooltip={'Settings'} on:click={() => (showSettings = true)} />

			<div class="relative inline-block text-left">
				<button
					on:click={() => (showDataDropDown = !showDataDropDown)}
					class="flex justify-between w-full rounded border border-gray-300 p-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring focus:ring-indigo-500"
				>
					{selectedDropDownOption || '-- Select an Example --'}
					<div class={`ml-2 transition-transform duration-300 ${showDataDropDown ? 'rotate-0' : 'rotate-180'}`}>
						<span class="block w-3 h-3 border-l border-t border-gray-700 transform rotate-45"></span>
					</div>
				</button>

				{#if showDataDropDown}
					<div class="absolute z-10 mt-2 w-full rounded-md bg-white shadow-lg max-h-[75vh] overflow-y-auto">
						<ul class="py-1" role="menu" aria-orientation="vertical">
							{#each dropdownOptions as group}
								<li class="px-4 py-2 font-semibold text-gray-600">{group.label}</li>
								{#each group.items as item}
									<li>
										<button
											on:click={() => {
												updateExampleDataDropDown({ target: { value: item.value } });
												showDataDropDown = false;
												selectedDropDownOption = item.label;
											}}
											class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
										>
											{item.label}
										</button>
									</li>
								{/each}
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<div class="h-10">
	<P5 {sketch} />
</div>

{#if showSettings}
	<div
		class="modal modal-open"
		on:click|self={() => (showSettings = false)}
		on:keydown={(e) => {
			if (e.key === 'Escape') showSettings = false;
		}}
	>
		<div class="modal-box w-11/12 max-w-md">
			<div class="flex justify-between mb-4">
				<h3 class="font-bold text-lg">Settings</h3>
				<button class="btn btn-circle btn-sm" on:click={() => (showSettings = false)}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="flex flex-col space-y-4">
				<!-- Animation Rate -->
				<div class="flex flex-col">
					<label for="animationRate" class="font-medium">Animation Rate: {currentConfig.animationRate}</label>
					<input
						id="animationRate"
						type="range"
						min="0.01"
						max="1"
						step="0.01"
						bind:value={currentConfig.animationRate}
						on:input={(e) => handleConfigChange('animationRate', parseFloat(e.target.value))}
						class="range range-primary"
					/>
				</div>

				<!-- Sampling Interval -->
				<div class="flex flex-col">
					<label for="samplingInterval" class="font-medium">Sampling Interval: {currentConfig.samplingInterval} sec</label>
					<input
						id="samplingInterval"
						type="range"
						min="0.1"
						max="5"
						step="0.1"
						bind:value={currentConfig.samplingInterval}
						on:input={(e) => handleConfigChange('samplingInterval', parseFloat(e.target.value))}
						class="range range-primary"
					/>
				</div>

				<!-- Small Data Threshold -->
				<div class="flex flex-col">
					<label for="smallDataThreshold" class="font-medium">Small Data Threshold: {currentConfig.smallDataThreshold}</label>
					<input
						id="smallDataThreshold"
						type="range"
						min="500"
						max="10000"
						step="100"
						bind:value={currentConfig.smallDataThreshold}
						on:input={(e) => handleConfigChange('smallDataThreshold', parseInt(e.target.value))}
						class="range range-primary"
					/>
				</div>

				<!-- Movement StrokeWeight -->
				<div class="flex flex-col">
					<label for="movementStrokeWeight" class="font-medium">Movement Line Weight: {currentConfig.movementStrokeWeight}</label>
					<input
						id="movementStrokeWeight"
						type="range"
						min="1"
						max="20"
						step="1"
						bind:value={currentConfig.movementStrokeWeight}
						on:input={(e) => handleConfigChange('movementStrokeWeight', parseInt(e.target.value))}
						class="range range-primary"
					/>
				</div>

				<!-- Stop StrokeWeight -->
				<div class="flex flex-col">
					<label for="stopStrokeWeight" class="font-medium">Stop Line Weight: {currentConfig.stopStrokeWeight}</label>
					<input
						id="stopStrokeWeight"
						type="range"
						min="1"
						max="20"
						step="1"
						bind:value={currentConfig.stopStrokeWeight}
						on:input={(e) => handleConfigChange('stopStrokeWeight', parseInt(e.target.value))}
						class="range range-primary"
					/>
				</div>

				<!-- Text Input for Seconds (Numeric Only) -->
				<div class="flex flex-col">
					<label for="inputSeconds" class="font-medium">End Time (seconds)</label>
					<input
						id="inputSeconds"
						type="text"
						bind:value={timeline.endTime}
						on:input={(e) => {
							let value = parseInt(e.target.value.replace(/\D/g, '')) || 0;
							TimelineStore.update((timeline) => {
								timeline.setCurrTime(0);
								timeline.setStartTime(0);
								timeline.setEndTime(value);
								timeline.setLeftMarker(0);
								timeline.setRightMarker(value);
								return timeline;
							});
						}}
						class="input input-bordered"
					/>
				</div>
			</div>

			<div class="flex flex-col mt-4">
				<button class="btn btn-sm ml-4" on:click={() => (showDataPopup = true)}>Data Explorer</button>
			</div>

			<div class="modal-action">
				<button class="btn btn-warning" on:click={resetSettings}> Reset Settings </button>
				<button class="btn" on:click={() => (showSettings = false)}>Close</button>
			</div>
		</div>
	</div>
{/if}

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
					<p>Here you will find detailed information on the data that you have uploaded.</p>
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
	<div class="flex flex-1 flex-row justify-start items-center bg-[#f6f5f3] items-start px-8 overflow-x-auto"
	on:wheel={(e) => {
		if (e.deltaY !== 0) {
			e.preventDefault();
			e.currentTarget.scrollLeft += e.deltaY;
		}
	}}>
		{#if $ConfigStore.dataHasCodes}
			<div class="relative mr-2">
				<button
					class="btn"
					on:click={(event) => {
						// Stop event propagation to prevent the global click handler from closing the dropdown
						event.stopPropagation();

						// Toggle the dropdown
						toggleDropdown('dropdown-codes', 'btn-codes');
					}}
					id="btn-codes"
				>
					CODES
				</button>

				<div id="dropdown-container-codes">
					<div
						id="dropdown-codes"
						class="hidden bg-base-100 rounded-box p-2 shadow absolute"
						style="z-index: 9999;"
					>
					<ul class="menu w-64 max-h-[75vh] overflow-y-auto flex-nowrap">
					<li>
						<div class="flex items-center">
							<input
								id="enableAllCodes"
								type="checkbox"
								class="checkbox"
								checked={$CodeStore.every((code) => code.enabled)}
								on:change={() => {
									toggleSelectAllCodes();
									p5Instance?.loop();
								}}
							/>
							Enable All
						</div>
						<div class="flex items-center">
							<input
								id="colorByCodes"
								type="checkbox"
								class="checkbox"
								bind:checked={$ConfigStore.isPathColorMode}
								on:change={() => p5Instance?.loop()}
							/>
							Color by Codes
						</div>
						<div class="divider" />
					</li>
					{#each sortedCodes as code, index}
						<li><h3 class="pointer-events-none">{code.code.toUpperCase()}</h3></li>
						<li>
							<div class="flex items-center">
								<input
									id="codeCheckbox-{code.code}"
									type="checkbox"
									class="checkbox"
									bind:checked={code.enabled}
									on:change={() => p5Instance?.loop()}
								/>
								Enabled
							</div>
						</li>
						<li>
							<div class="flex items-center">
								<input type="color" class="color-picker max-w-[24px] max-h-[28px]" bind:value={code.color} on:change={() => p5Instance?.loop()} />
								Color
							</div>
						</li>
						{#if index !== sortedCodes.length - 1}
							<div class="divider" />
						{/if}
					{/each}
					</ul>
					</div>
				</div>
			</div>
		{/if}

		<!-- Users Dropdowns with Floating UI -->
		{#each $UserStore as user, index}
			<div class="relative mr-2">
				<button
					class="btn" style="color: {user.color};"
					on:click={(event) => {
						// Stop event propagation to prevent the global click handler from closing the dropdown
						event.stopPropagation();

						// Toggle the dropdown
						toggleDropdown(`dropdown-${user.name}`, `btn-${user.name}`);
					}}
					id={`btn-${user.name}`}
				>
					{user.name}
				</button>

				<div id={`dropdown-container-${user.name}`}>
					<div
						id={`dropdown-${user.name}`}
						class="hidden bg-base-100 rounded-box p-2 shadow absolute"
						style="z-index: 9999;"
					>
					<ul class="w-52">
						<li class="py-2">
							<div class="flex items-center">
								<input
									id="userCheckbox-{user.name}"
									type="checkbox"
									class="checkbox mr-2"
									bind:checked={user.enabled}
									on:change={() => p5Instance?.loop()}
								/>
								<label for="userCheckbox-{user.name}">Movement</label>
							</div>
						</li>
						<li class="py-2">
							<div class="flex items-center">
								<input
									id="userTalkCheckbox-{user.name}"
									type="checkbox"
									class="checkbox mr-2"
									bind:checked={user.conversation_enabled}
									on:change={() => p5Instance?.loop()}
								/>
								<label for="userTalkCheckbox-{user.name}">Talk</label>
							</div>
						</li>
						<li class="py-2">
							<div class="flex items-center">
								<input
									type="color"
									class="color-picker max-w-[24px] max-h-[28px] mr-2"
									bind:value={user.color}
									on:change={() => p5Instance?.loop()}
								/>
								<span>Color</span>
							</div>
						</li>
					</ul>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Right Side: Timeline -->
	<div class="flex-1 bg-[#f6f5f3]">
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
</style>
