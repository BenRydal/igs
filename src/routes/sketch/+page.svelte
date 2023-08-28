<script lang="ts">
	import MdHelpOutline from 'svelte-icons/md/MdHelpOutline.svelte';
	import MdCloudUpload from 'svelte-icons/md/MdCloudUpload.svelte';
	import MdCloudDownload from 'svelte-icons/md/MdCloudDownload.svelte';
	import MdRotateLeft from 'svelte-icons/md/MdRotateLeft.svelte';
	import MdRotateRight from 'svelte-icons/md/MdRotateRight.svelte';
	import MdMenu from 'svelte-icons/md/MdMenu.svelte';
	import Md3DRotation from 'svelte-icons/md/Md3DRotation.svelte';

	import P5, { type Sketch } from 'p5-svelte';
	import Papa from 'papaparse';

	import UserStore from '../../stores/userStore';
	import P5Store from '../../stores/p5Store';

	import { DataPoint } from '../../models/dataPoint';
	import { User } from '../../models/user';

	import {
		Core,
		FloorPlan,
		SketchGUI,
		DomHandler,
		DomController,
		SketchController,
		Handle3D,
		VideoController,
		SetPathData,
		AddListeners
	} from '../../lib';
	import type p5 from 'p5';

	let files: any = [];
	let selectedTab = 'Movement';
	let tabOptions = [
		'Movement',
		'Talk',
		'Video',
		'Animate',
		'Select',
		'Floor Plan',
		'Codes',
		'Export'
	];

	let users: User[] = [];
	let p5Instance: p5 | null = null;

	// TODO: Deal with colours in a more dynamic way so that we can have more than 16 users
	const colors = [
		'#D8A7B1',
		'#B39AB1',
		'#9AA7B1',
		'#A7B1B1',
		'#A7B19A',
		'#B1A798',
		'#B1A7B0',
		'#A798A7',
		'#D9C8B3',
		'#D9C8C4',
		'#B3C4D9',
		'#B3D9C8',
		'#C8D9B3',
		'#C4D9D2',
		'#D9C4D2',
		'#D2D9C4'
	];

	UserStore.subscribe((data) => {
		users = data;
	});

	P5Store.subscribe((value) => {
		p5Instance = value;
	});

	// Handles processing of example data. Movement/code CSV files unique to each example
	async function handleExampleDropdown(event: any) {
		if (p5Instance) {
			const selectedValue = event.target.value;
			await loadFloorplanImage(p5Instance, selectedValue);
			// await loadCSVData(`data/${selectedValue}/conversation.csv`);

			switch (selectedValue) {
				case 'example-1':
					UserStore.update((currentUsers) => {
						return [];
					});
					await loadCSVData(`data/${selectedValue}/jordan.csv`);
					// await loadCSVData(`data/${selectedValue}/possession.csv`);
					break;
				case 'example-2':
					UserStore.update((currentUsers) => {
						return [];
					});
					await loadCSVData(`data/${selectedValue}/adhir.csv`);
					await loadCSVData(`data/${selectedValue}/blake.csv`);
					await loadCSVData(`data/${selectedValue}/jeans.csv`);
					await loadCSVData(`data/${selectedValue}/lily.csv`);
					await loadCSVData(`data/${selectedValue}/mae.csv`);
					break;
				case 'example-3':
					UserStore.update((currentUsers) => {
						return [];
					});
					await loadCSVData(`data/${selectedValue}/teacher.csv`);
					break;
				case 'example-4':
					UserStore.update((currentUsers) => {
						return [];
					});
					await loadCSVData(`data/${selectedValue}/cassandra.csv`);
					await loadCSVData(`data/${selectedValue}/mei.csv`);
					await loadCSVData(`data/${selectedValue}/nathan.csv`);
					await loadCSVData(`data/${selectedValue}/sean.csv`);
					await loadCSVData(`data/${selectedValue}/teacher.csv`);
					break;
			}
		} else {
			console.log('p5Instance has not been instantiated yet!');
		}
	}

	async function loadCSVData(path: string) {
		const csvResponse = await fetch(`${path}`);
		const csvText = await csvResponse.text();
		Papa.parse(csvText, {
			dynamicTyping: true,
			skipEmptyLines: 'greedy',
			header: true,
			transformHeader: (h) => {
				return h.trim().toLowerCase();
			},
			complete: (results: any) => convertFileToUsers(results, path)
		});
	}

	async function loadConversationData(selectedValue: string) {
		// Determine the path based on the selected value
		const path = `data/${selectedValue}/conversation.csv`;
		// Load and parse the CSV using PapaParse
		const result = await new Promise((resolve) => {
			Papa.parse(path, {
				download: true,
				header: true,
				complete: resolve
			});
		});

		return result.data;
	}

	function loadFloorplanImage(p5Instance: p5, selectedValue: string) {
		// Determine the path based on the selected value
		const path = `data/${selectedValue}/floorplan.png`;

		// Load the image into p5.js
		// Add logic so that typescript does not complain about
		// null possibiltiy
		p5Instance.loadImage(path, (img) => {
			p5Instance.floorPlan.img = img;
			p5Instance.floorPlan.width = img.width;
			p5Instance.floorPlan.height = img.height;
			p5Instance.loop();
		});
	}

	const sketch: Sketch = (p5: any) => {
		P5Store.set(p5);

		p5.preload = () => {
			p5.font = p5.loadFont('/fonts/PlusJakartaSans/VariableFont_wght.ttf');
		};

		p5.setup = () => {
			p5.createCanvas(window.innerWidth, window.innerHeight - 160, p5.WEBGL);

			// Library classes
			p5.core = new Core(p5);
			p5.gui = new SketchGUI(p5);
			p5.domHandler = new DomHandler(p5);
			p5.domController = new DomController(p5);
			p5.sketchController = new SketchController(p5);
			p5.handle3D = new Handle3D(p5, true);
			p5.videoController = new VideoController(p5);
			p5.floorPlan = new FloorPlan(p5);

			// Constants
			p5.PLAN = 0;
			p5.SPACE_TIME = 0;
			p5.GUI_TEXT_SIZE = p5.width / 70;

			// STYLES
			p5.textSize(p5.GUI_TEXT_SIZE);
			p5.textFont(p5.font);
			p5.textAlign(p5.LEFT, p5.TOP);
			p5.smooth();

			AddListeners(p5);
		};

		p5.draw = () => {
			console.log('Drawing...');
			p5.background(255);
			p5.translate(-p5.width / 2, -p5.height / 2, 0); // recenter canvas to top left when using WEBGL renderer

			if (p5.handle3D.getIs3DModeOrTransitioning()) {
				// Translate/update canvas if in 3D mode
				p5.push();
				p5.handle3D.update3DTranslation();
			}
			p5.visualizeData();
			p5.gui.update3D(); // draw canvas GUI elements that adapt to 3D mode

			if (p5.handle3D.getIs3DModeOrTransitioning()) p5.pop();
			p5.gui.update2D(); // draw all other canvas GUI elements in 2D mode
			if (p5.sketchController.getIsAnimate() && !p5.sketchController.getIsAnimatePause())
				p5.sketchController.updateAnimation(p5.domController.getAnimateSliderValue());
			// Determine whether to re-run draw loop depending on user adjustable modes
			// Might not be running because of not being able to sense if the data is being tracked and such.
			if (
				(p5.sketchController.getIsAnimate() && !p5.sketchController.getIsAnimatePause()) ||
				p5.videoController.isLoadedAndIsPlaying() ||
				p5.handle3D.getIsTransitioning()
			) {
				p5.loop();
			} else p5.noLoop();
		};

		p5.dataIsLoaded = (data: any) => {
			return data != null; // in javascript this tests for both undefined and null values
		};

		p5.visualizeData = () => {
			console.log('visualizeData()');
			if (p5.dataIsLoaded(p5.floorPlan.getImg())) {
				// floorPlan must be loaded to draw any data

				p5.floorPlan.setFloorPlan(p5.gui.fpContainer.getContainer());

				// console.log('DEBUG: visualizeData is loaded - starting to draw...');

				if (p5.arrayIsLoaded(users)) {
					// console.log('Path list is loaded');
					const setPathData = new SetPathData(p5, p5.core.codeList);
					if (p5.arrayIsLoaded(users)) {
						// console.log('Users is an array and has length');
						setPathData.setMovement(users);
						//setPathData.setMovementAndConversation(users, users);
					}
					//  else setPathData.setMovement(users);
				}
			}

			p5.videoController.updateDisplay();
		};

		// TODO: This needs to be moved eventually
		// Used by `timeline-panel.js` to determine whether to draw the timeline
		p5.overRect = (x: number, y: number, boxWidth: number, boxHeight: number) => {
			return (
				p5.mouseX >= x && p5.mouseX <= x + boxWidth && p5.mouseY >= y && p5.mouseY <= y + boxHeight
			);
		};

		// /**
		//  * Determines what data is loaded and calls appropriate class drawing methods for that data
		//  */
		// p5.visualizeData = () => {
		//   if (p5.dataIsLoaded(p5.floorPlan.getImg())) { // floorPlan must be loaded to draw any data
		//     p5.floorPlan.setFloorPlan(p5.gui.fpContainer.getContainer());

		//     if (p5.arrayIsLoaded(p5.core.pathList)) {
		//       const setPathData = new SetPathData(p5, p5.core.codeList);
		//       if (p5.arrayIsLoaded(p5.core.speakerList)) setPathData.setMovementAndConversation(p5.core.pathList, p5.core.speakerList);
		//       else setPathData.setMovement(p5.core.pathList);
		//     }
		//   }
		//   p5.videoController.updateDisplay();
		// }

		// p5.mousePressed = () => {
		//   if (!p5.sketchController.getIsAnimate() && p5.gui.timelinePanel.overTimeline() && !p5.gui.timelinePanel.overEitherSelector()) p5.videoController.timelinePlayPause();
		//   else if (p5.sketchController.getCurSelectTab() === 5 && !p5.handle3D.getIs3DModeOrTransitioning()) p5.gui.highlight.handleMousePressed();
		//   p5.loop();
		// }

		// p5.mouseDragged = () => {
		//   if (!p5.sketchController.getIsAnimate() && p5.gui.timelinePanel.isLockedOrOverTimeline()) p5.gui.timelinePanel.handle();
		//   p5.loop();
		// }

		// p5.mouseReleased = () => {
		//   if (p5.sketchController.getCurSelectTab() === 5 && !p5.handle3D.getIs3DModeOrTransitioning() && !p5.gui.timelinePanel.isLockedOrOverTimeline()) p5.gui.highlight.handleMouseRelease();
		//   p5.gui.timelinePanel.resetLock(); // reset after handlingHighlight
		//   p5.loop();
		// }

		// p5.mouseMoved = () => {
		//   if (p5.gui.timelinePanel.overEitherSelector()) p5.cursor(p5.HAND);
		//   else if (p5.sketchController.getCurSelectTab() === 5) p5.cursor(p5.CROSS);
		//   else p5.cursor(p5.ARROW);
		//   p5.loop();
		// }

		// p5.saveCodeFile = () => {
		//   if (p5.dataIsLoaded(p5.floorPlan.getImg()) && p5.arrayIsLoaded(p5.core.pathList)) {
		//     const setPathData = new SetPathData(p5, p5.core.codeList);
		//     setPathData.setCodeFile(p5.core.pathList);
		//   }
		// }

		// p5.windowResized = () => {
		//   p5.resizeCanvas(window.innerWidth - 100, window.innerHeight- 100);
		//   p5.gui = new SketchGUI(p5); // update GUI vars
		//   p5.GUITEXTSIZE = p5.width / 70;
		//   p5.textSize(p5.GUITEXTSIZE);
		//   p5.handle3D = new Handle3D(p5, p5.handle3D.getIs3DMode()); // update 3D display vars, pass current 3D mode
		//   p5.loop();
		// }

		// p5.overCircle = (x: number, y: number, diameter: number) => {
		//   return p5.sqrt(p5.sq(x - p5.mouseX) + p5.sq(y - p5.mouseY)) < diameter / 2;
		// }

		// Used in core.js for tracking path and such
		p5.arrayIsLoaded = (data: any) => {
			return Array.isArray(data) && data.length;
		};

		// const test = () => {
		//   console.log("Test function.")
		// }
	};

	// const handleExampleDropdown = (event: any) => {
	//   const selectedValue = event.target.value;
	//   loadFloorplanImage(selectedValue);
	// }

	// Function to handle file selection and data parsing
	const handleFileSelect = (event: any) => {
		const file = event.target.files[0];
		const fileName = file.name;

		// console.log('Parsing file: ' + fileName);

		Papa.parse(file, {
			header: true,
			dynamicTyping: true,
			skipEmptyLines: 'greedy',
			transformHeader: (h) => {
				return h.trim().toLowerCase();
			},
			complete: (results: any) => convertFileToUsers(results, fileName),
			error: (error, file) => {
				alert(
					'Parsing error with one of your CSV file. Please make sure your file is formatted correctly as a .CSV'
				);
				// console.log(error, file);
			}
		});

		// console.log('File selected: ' + fileName);
	};

	// Function to handle data parsing completion
	const convertFileToUsers = (results: any, fileName: string) => {
		const csvData = results.data;

		// TODO: add additional data tests/checks
		if ('x' in csvData[0] && 'y' in csvData[0]) {
			console.log('info: Movement Data');
			UserStore.update((currentUsers) => {
				let users = [...currentUsers]; // clone the current users
				csvData.forEach((row: any) => {
					let user = null;
					// Movement Files
					const userName = fileName.split('/')[2].slice(0, -4);
					user = users.find((user) => user.name === userName);

					if (!user) {
						user = new User(true, userName, new Map<number, DataPoint>(), colors[users.length]);
						users.push(user);
					}

					if (user.dataTrail.has(row.time)) {
						user.dataTrail.get(row.time).x = row.x;
						user.dataTrail.get(row.time).y = row.y;
					} else {
						user.dataTrail.set(row.time, new DataPoint('', row.x, row.y));
					}

					// p5Instance.core.updateMovement(stringName, user.dataTrail, []);
					p5Instance.core.setTotalTime(row.time);
				});

				p5Instance.loop();
				return users;
			});
		} else if ('code' in csvData[0] && 'start' in csvData[0] && 'end' in csvData[0]) {
			// console.log('info: Code Data');
			UserStore.update((currentUsers) => {
				let users = [...currentUsers]; // clone the current users
				csvData.forEach((row: any) => {
					users.forEach((user) => user.segments.push(row.code));
				});

				return users;
			});
		} else if ('speaker' in csvData[0] && 'talk' in csvData[0]) {
			UserStore.update((currentUsers) => {
				let users = [...currentUsers]; // clone the current users
				csvData.forEach((row: any) => {
					let user = null;
					user = users.find((user) => user.name === row.speaker);

					if (!user) {
						user = new User(true, row.speaker, new Map<number, DataPoint>(), colors[users.length]);
						users.push(user);
					}

					user.dataTrail.set(row.time, new DataPoint(row.talk, 0, 0));
				});

				return users;
			});
		}
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
					<div class="btn icon max-h-8">
						<MdRotateLeft />
					</div>
					<div class="btn icon max-h-8">
						<MdRotateRight />
					</div>
					<div class="btn icon max-h-8">
						<MdCloudDownload />
					</div>
					<label class="btn icon max-h-8" for="file-input">
						<MdCloudUpload />
					</label>

					<input
						class="hidden"
						id="file-input"
						type="file"
						bind:files
						on:change={(event) => handleFileSelect(event)}
					/>
					<div id="btn-help" class="btn icon max-h-8">
						<MdHelpOutline />
					</div>

					<div id="btn-toggle-3d" class="btn icon max-h-8">
						<Md3DRotation />
					</div>

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

		<div class="btm-nav">
			<div>
				<div class="join w-full">
					<!-- Align the below objects vertically using tailwind -->

					<select
						bind:value={selectedTab}
						id="select-data-dropdown"
						class="select select-bordered max-w-xs bg-neutral text-white dropdown-top"
					>
						{#each tabOptions as value}<option {value}>{value}</option>{/each}
					</select>

					<div class="carousel carousel-center flex mx-5 align-middle">
						{#if selectedTab == 'Movement'}
							{#each $UserStore as user}
								<div class="carousel-item align-middle inline-block">
									<!-- When the below checkbox gets updated, update the path as well if it's selected -->
									<input type="checkbox" class="checkbox" bind:checked={user.enabled} />
									<label class="m-5">{user.name}</label>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
			<div />
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

<!-- Put this part before </body> tag -->
<input type="checkbox" checked={false} id="my-modal" class="modal-toggle" />
<div class="modal">
	<div class="modal-box max-w-7xl">
		<div class="hero p-20">
			<div class="hero-content text-left">
				<div class="max-w-16">
					<h1 class="text-5xl font-bold pb-8">INTERACTION GEOGRAPHY SLICER (IGS)</h1>
					<p class="py-3">
						Hello! This is a tool to visualize movement, conversation, and video data over space and
						time. Data are displayed over a floor plan and a timeline and can be viewed in 2D or 3D.
					</p>
					<p class="py-3">
						Use the top menu to visualize different sample datasets or upload your own data. Use the
						bottom left tabs as well as the timeline to selectively study displayed data. For
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
						contributors with support from the National Science Foundation. Contribute | Reference |
						Learn More About Interaction Geography
					</p>
					<!-- <button class="btn btn-primary">Get Started</button> -->
					<div class="modal-action">
						<label for="my-modal" class="btn btn-primary">Get Started</label>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
