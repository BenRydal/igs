<script lang="ts">
	import { writable, type Writable } from 'svelte/store';
	import {
		X,
		Lightbulb,
		CirclePlay,
		ShieldCheck,
		MessageSquare,
		Github,
		CloudUpload,
		Video,
		Route,
		MessageCircle,
		Box,
		BookOpen
	} from '@lucide/svelte';

	interface Props {
		isModalOpen?: Writable<boolean>;
		onStartTour?: (() => void) | null;
		onOpenImport?: (() => void) | null;
	}

	let {
		isModalOpen = writable(false),
		onStartTour = null,
		onOpenImport = null
	}: Props = $props();

	let activeTab: 'start' | 'import' | 'about' = $state('start');

	const tabs = [
		{ id: 'start', label: 'Get Started' },
		{ id: 'import', label: 'Import Data' },
		{ id: 'about', label: 'About' }
	] as const;

	const examples = [
		{
			id: 'example-1',
			title: "Jordan's Last Shot",
			description: "Michael Jordan's iconic final shot with the Chicago Bulls, tracked across the court",
			duration: '37 sec',
			category: 'Sports',
			image: '/images/1-example-jordan.webp'
		},
		{
			id: 'example-2',
			title: 'Museum Gallery Visit',
			description: 'A family explores a gallery featuring early country and bluegrass artists',
			duration: '8 min',
			category: 'Museum',
			image: '/images/2-example-museum.webp'
		},
		{
			id: 'example-3',
			title: '8th Grade Science Lesson',
			description: 'Teacher and student movement tracked during a TIMSS classroom lesson',
			duration: '56 min',
			category: 'Classroom',
			image: '/images/3-example-timss.webp'
		},
		{
			id: 'example-12',
			title: 'Civil Rights Walking Tour',
			description: 'GPS-tracked walking tour creating a route through historic civil rights sites',
			duration: '43 min',
			category: 'Outdoor',
			image: '/images/4-example-tour.webp'
		}
	];

	function closeModal() {
		$isModalOpen = false;
	}

	function closeAndRun(fn: (() => void) | null) {
		fn?.();
		$isModalOpen = false;
	}

	function loadExample(exampleId: string) {
		closeModal();
		window.dispatchEvent(new CustomEvent('igs:load-example', { detail: { value: exampleId } }));
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') $isModalOpen = false;
	}
</script>

{#if $isModalOpen}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="modal modal-open"
		onclick={(e) => {
			if (e.target === e.currentTarget) $isModalOpen = false;
		}}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="igs-modal-title"
	>
		<div class="modal-box max-w-4xl max-h-[90vh] p-0 overflow-y-auto">
			<!-- ============ HEADER ============ -->
			<div class="relative px-8 py-6 overflow-hidden">
				<div
					class="absolute inset-0 bg-cover bg-center"
					style="background-image: url(/images/igs-background.png);"
				></div>
				<div class="absolute inset-0 bg-blue-950/85"></div>
				<div class="relative z-10">
					<div class="flex justify-between items-start">
						<div class="flex-1 pr-8">
							<h1 id="igs-modal-title" class="text-3xl font-bold text-white italic mb-2">
								Interaction Geography Slicer
							</h1>
							<p class="text-blue-100 text-lg">
								Dynamically visualize how people move and interact over space and time
							</p>
						</div>
						<button
							class="btn btn-circle btn-ghost btn-sm text-white hover:bg-white/20 flex-shrink-0"
							onclick={closeModal}
							aria-label="Close modal"
						>
							<X size={24} />
						</button>
					</div>
					<div
						class="mt-4 inline-flex items-center gap-2 bg-emerald-400/20 text-emerald-200 rounded-full px-3 py-1 text-sm border border-emerald-400/30"
					>
						<ShieldCheck size={16} />
						<span>100% private — runs entirely in your browser</span>
					</div>
				</div>
			</div>

			<!-- ============ TABS ============ -->
			<div class="border-b border-gray-200 bg-base-100">
				<div class="flex px-8" role="tablist">
					{#each tabs as tab}
						<button
							role="tab"
							aria-selected={activeTab === tab.id}
							aria-controls="tabpanel-{tab.id}"
							class="px-4 py-3 text-sm font-medium border-b-2 transition-colors {activeTab === tab.id
								? 'border-gray-800 text-gray-800'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
							onclick={() => (activeTab = tab.id)}
						>
							{tab.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- ============ TAB CONTENT ============ -->
			<div class="px-8 py-6">
				<!-- -------- Get Started -------- -->
				{#if activeTab === 'start'}
					<div id="tabpanel-start" role="tabpanel">
						<!-- Action cards -->
						<div class="flex gap-4 mb-6">
							<button
								onclick={() => {
									closeModal();
									onStartTour?.();
									window.dispatchEvent(new Event('restart-tour'));
								}}
								class="flex-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 hover:border-amber-400 transition-all group text-left"
							>
								<div class="flex items-center gap-3">
									<div
										class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors text-amber-600"
									>
										<Lightbulb size={20} />
									</div>
									<div>
										<h3 class="font-semibold text-gray-800 group-hover:text-amber-700">
											Take a Guided Tour
										</h3>
										<p class="text-sm text-gray-500">Interactive walkthrough of the interface</p>
									</div>
								</div>
							</button>
							<a
								href="https://www.youtube.com/watch?v=smoxv9AspHA"
								target="_blank"
								rel="noopener noreferrer"
								class="flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:border-blue-400 transition-all group text-left"
							>
								<div class="flex items-center gap-3">
									<div
										class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors text-blue-600"
									>
										<CirclePlay size={20} />
									</div>
									<div>
										<h3 class="font-semibold text-gray-800 group-hover:text-blue-700">
											Watch Demo Video
										</h3>
										<p class="text-sm text-gray-500">See the tool in action</p>
									</div>
								</div>
							</a>
						</div>

						<!-- Examples -->
						<h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
							Or dive in with an example
						</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
							{#each examples as example}
								<button
									class="text-left border border-gray-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all group overflow-hidden flex"
									onclick={() => loadExample(example.id)}
								>
									<img
										src={example.image}
										alt={example.title}
										class="w-24 h-24 object-cover flex-shrink-0"
									/>
									<div class="p-3 flex flex-col justify-center">
										<h3
											class="font-semibold text-gray-800 group-hover:text-amber-700 mb-1 text-sm"
										>
											{example.title}
										</h3>
										<p class="text-xs text-gray-500 mb-1 line-clamp-2">{example.description}</p>
										<div class="flex gap-2 text-xs text-gray-400">
											<span>{example.category}</span>
											<span>{example.duration}</span>
										</div>
									</div>
								</button>
							{/each}
						</div>
					</div>

				<!-- -------- Import Data -------- -->
				{:else if activeTab === 'import'}
					<div id="tabpanel-import" role="tabpanel">
						<p class="text-gray-600 mb-5">
							IGS needs a <strong>background image</strong> (floor plan or auto-fetched map) and a
							<strong>movement file</strong> that records where someone was at each point in time.
							You can also add conversation transcripts, video, and codes.
						</p>

						<!-- Movement formats -->
						<div class="grid grid-cols-2 gap-4 mb-5">
							<!-- Indoor CSV -->
							<div class="bg-gray-50 rounded-lg p-4">
								<h4 class="font-medium text-gray-700 mb-2">Indoor movement (CSV)</h4>
								<div class="bg-base-100 border border-gray-200 rounded overflow-hidden">
									<table class="w-full text-xs">
										<thead class="bg-gray-100">
											<tr>
												<th class="px-2 py-1 text-left font-medium text-gray-700">time</th>
												<th class="px-2 py-1 text-left font-medium text-gray-700">x</th>
												<th class="px-2 py-1 text-left font-medium text-gray-700">y</th>
											</tr>
										</thead>
										<tbody class="font-mono">
											<tr class="border-t border-gray-100">
												<td class="px-2 py-1">0</td>
												<td class="px-2 py-1">337</td>
												<td class="px-2 py-1">371</td>
											</tr>
											<tr class="border-t border-gray-100">
												<td class="px-2 py-1">1</td>
												<td class="px-2 py-1">340</td>
												<td class="px-2 py-1">368</td>
											</tr>
											<tr class="border-t border-gray-100">
												<td class="px-2 py-1">2</td>
												<td class="px-2 py-1">345</td>
												<td class="px-2 py-1">362</td>
											</tr>
										</tbody>
									</table>
								</div>
								<p class="text-xs text-gray-500 mt-2">
									x,y are pixel coordinates on your floor plan image
								</p>
							</div>

							<!-- GPS CSV -->
							<div class="bg-gray-50 rounded-lg p-4">
								<h4 class="font-medium text-gray-700 mb-2">Outdoor / GPS (CSV)</h4>
								<div class="bg-base-100 border border-gray-200 rounded overflow-hidden">
									<table class="w-full text-xs">
										<thead class="bg-gray-100">
											<tr>
												<th class="px-2 py-1 text-left font-medium text-gray-700">time</th>
												<th class="px-2 py-1 text-left font-medium text-gray-700">lat</th>
												<th class="px-2 py-1 text-left font-medium text-gray-700">lng</th>
											</tr>
										</thead>
										<tbody class="font-mono">
											<tr class="border-t border-gray-100">
												<td class="px-2 py-1">0</td>
												<td class="px-2 py-1">40.7128</td>
												<td class="px-2 py-1">-74.0060</td>
											</tr>
											<tr class="border-t border-gray-100">
												<td class="px-2 py-1">5</td>
												<td class="px-2 py-1">40.7129</td>
												<td class="px-2 py-1">-74.0058</td>
											</tr>
										</tbody>
									</table>
								</div>
								<p class="text-xs text-gray-500 mt-2">
									IGS auto-fetches a map for GPS data. Also accepts GPX/KML files.
								</p>
							</div>

							<!-- Conversation -->
							<div class="bg-gray-50 rounded-lg p-4">
								<h4 class="font-medium text-gray-700 mb-2">
									Conversation <span class="text-gray-400 font-normal italic">(optional)</span>
								</h4>
								<div class="bg-base-100 border border-gray-200 rounded overflow-hidden">
									<table class="w-full text-xs">
										<thead class="bg-gray-100">
											<tr>
												<th class="px-2 py-1 text-left font-medium text-gray-700">time</th>
												<th class="px-2 py-1 text-left font-medium text-gray-700">speaker</th>
												<th class="px-2 py-1 text-left font-medium text-gray-700">talk</th>
											</tr>
										</thead>
										<tbody class="font-mono">
											<tr class="border-t border-gray-100">
												<td class="px-2 py-1">0</td>
												<td class="px-2 py-1">Teacher</td>
												<td class="px-2 py-1">Good morning</td>
											</tr>
											<tr class="border-t border-gray-100">
												<td class="px-2 py-1">3</td>
												<td class="px-2 py-1">Student1</td>
												<td class="px-2 py-1">Hi!</td>
											</tr>
										</tbody>
									</table>
								</div>
								<p class="text-xs text-gray-500 mt-2">
									Speaker names must match movement filenames to link paths
								</p>
							</div>

							<!-- Codes -->
							<div class="bg-gray-50 rounded-lg p-4">
								<h4 class="font-medium text-gray-700 mb-2">
									Codes <span class="text-gray-400 font-normal italic">(optional)</span>
								</h4>
								<div class="bg-base-100 border border-gray-200 rounded overflow-hidden">
									<table class="w-full text-xs">
										<thead class="bg-gray-100">
											<tr>
												<th class="px-2 py-1 text-left font-medium text-gray-700">code</th>
												<th class="px-2 py-1 text-left font-medium text-gray-700">start</th>
												<th class="px-2 py-1 text-left font-medium text-gray-700">end</th>
											</tr>
										</thead>
										<tbody class="font-mono">
											<tr class="border-t border-gray-100">
												<td class="px-2 py-1">Lecture</td>
												<td class="px-2 py-1">0</td>
												<td class="px-2 py-1">120</td>
											</tr>
											<tr class="border-t border-gray-100">
												<td class="px-2 py-1">Group Work</td>
												<td class="px-2 py-1">120</td>
												<td class="px-2 py-1">300</td>
											</tr>
										</tbody>
									</table>
								</div>
								<p class="text-xs text-gray-500 mt-2">
									Highlight time segments with activity labels
								</p>
							</div>
						</div>

						<!-- Time formats note -->
						<div class="bg-gray-50 rounded-lg p-4 mb-4">
							<h4 class="font-medium text-gray-700 mb-2">Supported time formats</h4>
							<div class="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-600">
								<span><code class="bg-gray-200 px-1 rounded">0</code> Seconds</span>
								<span><code class="bg-gray-200 px-1 rounded">1:30</code> MM:SS</span>
								<span><code class="bg-gray-200 px-1 rounded">0:01:30</code> HH:MM:SS</span>
								<span
									><code class="bg-gray-200 px-1 rounded">2024-03-15 14:30:00</code> Date+Time</span
								>
								<span
									><code class="bg-gray-200 px-1 rounded">2024-03-15T14:30:00Z</code> ISO</span
								>
							</div>
							<p class="text-xs text-gray-500 mt-2">
								IGS auto-converts everything to relative time, starting from 0.
							</p>
						</div>

						<!-- Video info box -->
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
							<div class="flex items-start gap-3">
								<Video size={20} class="text-blue-600 flex-shrink-0 mt-0.5" />
								<div>
									<h4 class="font-medium text-blue-800 mb-1">Video synchronization</h4>
									<p class="text-sm text-blue-700">
										Upload an MP4 video alongside your data to sync visualizations with video
										playback. The video length should match your data's time range. File names
										become person labels in IGS (e.g.,
										<code class="bg-blue-100 px-1 rounded">Teacher.csv</code> becomes "Teacher").
									</p>
								</div>
							</div>
						</div>

						<!-- CTA -->
						<div class="flex gap-3">
							<button
								class="btn btn-primary"
								onclick={() => {
									closeModal();
									onOpenImport?.();
								}}
							>
								<CloudUpload size={20} class="mr-2" />
								Import Data
							</button>
							<a href="/guide" target="_blank" class="btn btn-outline">
								<BookOpen size={20} class="mr-2" />
								Full Data Guide
							</a>
						</div>
					</div>

				<!-- -------- About -------- -->
				{:else if activeTab === 'about'}
					<div id="tabpanel-about" role="tabpanel">
						<!-- What is IGS -->
						<div class="mb-6">
							<h3 class="text-lg font-semibold text-gray-800 mb-3">
								What is Interaction Geography Slicer?
							</h3>
							<p class="text-gray-600 mb-3">
								IGS is an open-source visualization tool for exploring how people move and interact
								over space and time. Originally developed for learning sciences research, IGS
								transforms movement data, conversation transcripts, and video into rich, interactive
								space-time visualizations.
							</p>
							<p class="text-gray-600">
								Whether you are analyzing classroom dynamics, museum visits, walking tours, or sports
								events, IGS helps you see patterns in spatial interaction that are invisible in raw
								data.
							</p>
						</div>

						<!-- Features -->
						<div class="mb-6">
							<h3 class="text-lg font-semibold text-gray-800 mb-3">Features</h3>
							<div class="grid grid-cols-2 gap-3">
								<div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
									<Route size={20} class="text-gray-500 flex-shrink-0 mt-0.5" />
									<div>
										<h4 class="font-medium text-gray-700 text-sm">Movement Paths</h4>
										<p class="text-xs text-gray-500">
											Visualize how people traverse space over time with color-coded paths
										</p>
									</div>
								</div>
								<div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
									<MessageCircle size={20} class="text-gray-500 flex-shrink-0 mt-0.5" />
									<div>
										<h4 class="font-medium text-gray-700 text-sm">Conversation in Space</h4>
										<p class="text-xs text-gray-500">
											Overlay speech on movement paths to see who said what, and where
										</p>
									</div>
								</div>
								<div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
									<Video size={20} class="text-gray-500 flex-shrink-0 mt-0.5" />
									<div>
										<h4 class="font-medium text-gray-700 text-sm">Synced Video</h4>
										<p class="text-xs text-gray-500">
											Watch video alongside the visualization with synchronized playback
										</p>
									</div>
								</div>
								<div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
									<Box size={20} class="text-gray-500 flex-shrink-0 mt-0.5" />
									<div>
										<h4 class="font-medium text-gray-700 text-sm">2D and 3D Views</h4>
										<p class="text-xs text-gray-500">
											Switch between flat floor plan view and a 3D space-time cube
										</p>
									</div>
								</div>
							</div>
						</div>

						<!-- Citation -->
						<div class="mb-2">
							<h3 class="text-lg font-semibold text-gray-800 mb-3">Citation</h3>
							<div class="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
								<p class="mb-2">If you use IGS in your research, please cite:</p>
								<blockquote
									class="border-l-4 border-gray-300 pl-3 italic text-gray-500 text-sm leading-relaxed"
								>
									Shapiro, B. R., Silvis, D., & Hall, R. (2025). Visualization as Theory and
									Experience: How Interaction Geographies Help Researchers See Classrooms Differently.
									<em>Journal of the Learning Sciences</em>.
									<a
										href="https://doi.org/10.1080/10508406.2025.2537945"
										target="_blank"
										rel="noopener noreferrer"
										class="text-blue-600 hover:underline not-italic"
									>
										doi:10.1080/10508406.2025.2537945
									</a>
								</blockquote>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- ============ FOOTER ============ -->
			<div class="bg-gray-50 px-8 py-4 border-t border-gray-200">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex flex-wrap items-center gap-3">
						<a
							href="https://forms.gle/M1gvdgSvdH9yXAABA"
							target="_blank"
							rel="noopener noreferrer"
							class="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
						>
							<MessageSquare size={16} />
							Feedback
						</a>
						<a
							href="https://github.com/BenRydal/igs"
							target="_blank"
							rel="noopener noreferrer"
							class="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
						>
							<Github size={16} />
							Open Source
						</a>
						<details class="relative">
							<summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-400">
								Credits
							</summary>
							<div
								class="absolute left-0 bottom-full mb-2 text-sm text-gray-500 text-left w-[90vw] max-w-[450px] bg-base-100 border border-gray-200 rounded-lg p-3 shadow-lg"
							>
								Example data from The Third International Mathematics and Science Study (TIMSS) 1999
								Video Study and the Country Music Hall of Fame and Museum. Walking tour data from the
								Interaction Geography research group. Movement tracking powered by
								<a
									href="https://github.com/BenRydal/mondrian"
									class="text-blue-600 hover:underline"
									target="_blank"
									rel="noopener noreferrer">Mondrian Transcription</a
								>.
							</div>
						</details>
					</div>

					<a
						href="https://doi.org/10.1080/10508406.2025.2537945"
						class="text-sm text-blue-700 hover:underline"
						target="_blank"
						rel="noopener noreferrer"
					>
						Shapiro, Silvis, & Hall (2025). <em>Visualization as Theory and Experience</em>
					</a>
				</div>
			</div>
		</div>
	</div>
{/if}
