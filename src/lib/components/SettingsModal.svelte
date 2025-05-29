<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ConfigStoreType } from '../../stores/configStore';
	import UserStore from '../../stores/userStore';
	import TimelineStore from '../../stores/timelineStore';

	export let currentConfig: ConfigStoreType;
	export let timeline: any;
	export let p5Instance: any;
	export let activeTab = 'general';

	const dispatch = createEventDispatcher();

	function handleConfigChange(key: string, value: any) {
		dispatch('configChange', { key, value });
	}

	function closeModal() {
		dispatch('close');
	}

	function resetSettings() {
		dispatch('reset');
	}

	function openDataExplorer() {
		dispatch('openDataExplorer');
	}
</script>

<div class="modal-box w-11/12 max-w-5xl max-h-[90vh]">
	<div class="sticky top-0 bg-base-100 z-10 pb-4 border-b">
		<div class="flex justify-between items-center">
			<h3 class="font-bold text-2xl">Settings</h3>
			<button class="btn btn-circle btn-sm" on:click={closeModal}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	</div>

	<div class="tabs tabs-boxed mb-4">
		<button class="tab {activeTab === 'general' ? 'tab-active' : ''}" on:click={() => activeTab = 'general'}>
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
			General
		</button>
		<button class="tab {activeTab === 'optimization' ? 'tab-active' : ''}" on:click={() => activeTab = 'optimization'}>
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
			</svg>
			Optimization
		</button>
		<button class="tab {activeTab === 'display' ? 'tab-active' : ''}" on:click={() => activeTab = 'display'}>
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
			</svg>
			Display
		</button>
		<button class="tab {activeTab === 'advanced' ? 'tab-active' : ''}" on:click={() => activeTab = 'advanced'}>
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
			</svg>
			Advanced
		</button>
	</div>

	<div class="overflow-y-auto max-h-[calc(90vh-200px)] px-2">
		{#if activeTab === 'general'}
			<div class="space-y-6">
				<!-- Animation Settings -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-lg">Animation</h3>
						
						<div class="form-control">
							<label class="label">
								<span class="label-text">Animation Speed</span>
								<span class="label-text-alt text-primary font-semibold">{currentConfig.animationRate}</span>
							</label>
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
							<div class="w-full flex justify-between text-xs px-2 opacity-60">
								<span>Slow</span>
								<span>Normal</span>
								<span>Fast</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Timeline Settings -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-lg">Timeline</h3>
						
						<div class="form-control">
							<label class="label">
								<span class="label-text">Start Time</span>
								<span class="label-text-alt">{timeline?.getStartTime() || 0}s</span>
							</label>
							<input
								type="text"
								value={timeline?.getStartTime() || 0}
								on:change={(e) => {
									if (timeline) {
										const value = parseFloat(e.target.value) || 0;
										TimelineStore.update((timeline) => {
											timeline.setStartTime(value);
											return timeline;
										});
									}
								}}
								class="input input-bordered input-sm"
								placeholder="0"
							/>
						</div>

						<div class="form-control mt-2">
							<label class="label">
								<span class="label-text">End Time</span>
								<span class="label-text-alt">{timeline?.getEndTime() || 0}s</span>
							</label>
							<input
								type="text"
								value={timeline?.getEndTime() || 0}
								on:change={(e) => {
									if (timeline) {
										const value = parseFloat(e.target.value) || 0;
										TimelineStore.update((timeline) => {
											timeline.setEndTime(value);
											timeline.setLeftMarker(0);
											timeline.setRightMarker(value);
											return timeline;
										});
									}
								}}
								class="input input-bordered input-sm"
								placeholder="0"
							/>
						</div>
					</div>
				</div>

				<!-- Data Settings -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-lg">Data Management</h3>
						
						<div class="form-control">
							<label class="label">
								<span class="label-text">Sampling Interval</span>
								<span class="label-text-alt text-primary font-semibold">{currentConfig.samplingInterval}s</span>
							</label>
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

						<div class="form-control mt-4">
							<label class="label">
								<span class="label-text">Small Data Threshold</span>
								<span class="label-text-alt text-primary font-semibold">{currentConfig.smallDataThreshold.toLocaleString()}</span>
							</label>
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
							<div class="w-full flex justify-between text-xs px-2 opacity-60">
								<span>500</span>
								<span>5,000</span>
								<span>10,000</span>
							</div>
						</div>

						<button class="btn btn-primary btn-sm mt-4" on:click={openDataExplorer}>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							Open Data Explorer
						</button>
					</div>
				</div>
			</div>

		{:else if activeTab === 'optimization'}
			<div class="space-y-6">
				<!-- Optimization Overview -->
				<div class="card bg-base-200">
					<div class="card-body">
						<div class="flex items-center justify-between mb-4">
							<h3 class="card-title text-lg">Path Optimization</h3>
							<input
								type="checkbox"
								class="toggle toggle-primary toggle-lg"
								bind:checked={currentConfig.useOptimizedTrail}
								on:change={() => p5Instance?.loop()}
							/>
						</div>

						{#if currentConfig.useOptimizedTrail && $UserStore.length > 0}
							{@const totalOriginal = $UserStore.reduce((sum, user) => sum + (user.optimizationStats?.original || user.dataTrail.length), 0)}
							{@const totalOptimized = $UserStore.reduce((sum, user) => sum + (user.optimizationStats?.optimized || user.dataTrail.length), 0)}
							{@const totalReduction = totalOriginal > 0 ? ((totalOriginal - totalOptimized) / totalOriginal * 100) : 0}
							<div class="stats shadow">
								<div class="stat">
									<div class="stat-title">Original Points</div>
									<div class="stat-value text-2xl">{totalOriginal.toLocaleString()}</div>
								</div>
								<div class="stat">
									<div class="stat-title">Optimized Points</div>
									<div class="stat-value text-2xl text-primary">{totalOptimized.toLocaleString()}</div>
								</div>
								<div class="stat">
									<div class="stat-title">Reduction</div>
									<div class="stat-value text-2xl text-success">{totalReduction.toFixed(1)}%</div>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Basic Optimization Settings -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-lg mb-4">Basic Settings</h3>
						
						<div class="form-control">
							<label class="label">
								<span class="label-text">Movement Distance Threshold</span>
								<span class="label-text-alt text-primary font-semibold">{currentConfig.optimizationDistance}px</span>
							</label>
							<input
								type="range"
								min="1"
								max="20"
								step="1"
								bind:value={currentConfig.optimizationDistance}
								on:input={(e) => handleConfigChange('optimizationDistance', parseInt(e.target.value))}
								class="range range-primary"
							/>
							<div class="label-text-alt text-xs opacity-60 mt-1">
								Points closer than this distance will be removed
							</div>
						</div>

						<div class="divider"></div>

						<div class="form-control">
							<label class="label cursor-pointer">
								<span class="label-text">Preserve Stop Points</span>
								<input
									type="checkbox"
									class="toggle toggle-primary"
									bind:checked={currentConfig.preserveStops}
									on:change={() => p5Instance?.loop()}
								/>
							</label>
							<span class="label-text-alt text-xs opacity-60">
								Keep start and end points of stops
							</span>
						</div>

						<div class="form-control mt-2">
							<label class="label cursor-pointer">
								<span class="label-text">Aggressive Optimization</span>
								<input
									type="checkbox"
									class="toggle toggle-primary"
									bind:checked={currentConfig.aggressiveOptimization}
									on:change={() => p5Instance?.loop()}
								/>
							</label>
							<span class="label-text-alt text-xs opacity-60">
								More aggressive reduction for dense datasets
							</span>
						</div>
					</div>
				</div>

				<!-- Stop Sampling Settings -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-lg mb-4">Stop Sampling</h3>
						
						<div class="form-control">
							<label class="label cursor-pointer">
								<span class="label-text">Enable Stop Sampling</span>
								<input
									type="checkbox"
									class="toggle toggle-primary"
									bind:checked={currentConfig.stopSamplingEnabled}
									on:change={() => p5Instance?.loop()}
								/>
							</label>
						</div>

						{#if currentConfig.stopSamplingEnabled}
							<div class="form-control mt-4">
								<label class="label">
									<span class="label-text">Stop Sampling Interval</span>
									<span class="label-text-alt text-primary font-semibold">{currentConfig.stopSamplingInterval} points</span>
								</label>
								<input
									type="range"
									min="2"
									max="20"
									step="1"
									bind:value={currentConfig.stopSamplingInterval}
									on:input={(e) => handleConfigChange('stopSamplingInterval', parseInt(e.target.value))}
									class="range range-primary"
								/>
							</div>
						{/if}
					</div>
				</div>

				<!-- Code Sampling Settings -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-lg mb-4">Code Sampling</h3>
						
						<div class="form-control">
							<label class="label cursor-pointer">
								<span class="label-text">Enable Code Sampling</span>
								<input
									type="checkbox"
									class="toggle toggle-primary"
									bind:checked={currentConfig.codeSamplingEnabled}
									on:change={() => p5Instance?.loop()}
								/>
							</label>
						</div>

						{#if currentConfig.codeSamplingEnabled}
							<div class="form-control mt-4">
								<label class="label">
									<span class="label-text">Code Sampling Interval</span>
									<span class="label-text-alt text-primary font-semibold">{currentConfig.codeSamplingInterval} points</span>
								</label>
								<input
									type="range"
									min="2"
									max="50"
									step="1"
									bind:value={currentConfig.codeSamplingInterval}
									on:input={(e) => handleConfigChange('codeSamplingInterval', parseInt(e.target.value))}
									class="range range-primary"
								/>
							</div>
						{/if}
					</div>
				</div>

				<!-- Temporal Smoothing Settings -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-lg mb-4">Temporal Smoothing</h3>
						
						<div class="form-control">
							<label class="label cursor-pointer">
								<span class="label-text">Enable Temporal Smoothing</span>
								<input
									type="checkbox"
									class="toggle toggle-primary"
									bind:checked={currentConfig.temporalSmoothing}
									on:change={() => p5Instance?.loop()}
								/>
							</label>
							<span class="label-text-alt text-xs opacity-60">
								Add interpolated points for smooth playback
							</span>
						</div>

						{#if currentConfig.temporalSmoothing}
							<div class="form-control mt-4">
								<label class="label">
									<span class="label-text">Maximum Time Gap</span>
									<span class="label-text-alt text-primary font-semibold">{currentConfig.maxTimeGap}s</span>
								</label>
								<input
									type="range"
									min="0.5"
									max="5"
									step="0.1"
									bind:value={currentConfig.maxTimeGap}
									on:input={(e) => handleConfigChange('maxTimeGap', parseFloat(e.target.value))}
									class="range range-primary"
								/>
							</div>

							<div class="form-control mt-4">
								<label class="label">
									<span class="label-text">Interpolation Threshold</span>
									<span class="label-text-alt text-primary font-semibold">{currentConfig.interpolationThreshold}s</span>
								</label>
								<input
									type="range"
									min="0.1"
									max="2"
									step="0.1"
									bind:value={currentConfig.interpolationThreshold}
									on:input={(e) => handleConfigChange('interpolationThreshold', parseFloat(e.target.value))}
									class="range range-primary"
								/>
							</div>
						{/if}
					</div>
				</div>
			</div>

		{:else if activeTab === 'display'}
			<div class="space-y-6">
				<!-- Line Weight Settings -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-lg mb-4">Line Weights</h3>
						
						<div class="form-control">
							<label class="label">
								<span class="label-text">Movement Line Weight</span>
								<span class="label-text-alt text-primary font-semibold">{currentConfig.movementStrokeWeight}</span>
							</label>
							<input
								type="range"
								min="1"
								max="20"
								step="1"
								bind:value={currentConfig.movementStrokeWeight}
								on:input={(e) => handleConfigChange('movementStrokeWeight', parseInt(e.target.value))}
								class="range range-primary"
							/>
						</div>

						<div class="form-control mt-4">
							<label class="label">
								<span class="label-text">Stop Line Weight</span>
								<span class="label-text-alt text-primary font-semibold">{currentConfig.stopStrokeWeight}</span>
							</label>
							<input
								type="range"
								min="1"
								max="20"
								step="1"
								bind:value={currentConfig.stopStrokeWeight}
								on:input={(e) => handleConfigChange('stopStrokeWeight', parseInt(e.target.value))}
								class="range range-primary"
							/>
						</div>
					</div>
				</div>

				<!-- Conversation Settings -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-lg mb-4">Conversation Display</h3>
						
						<div class="form-control">
							<label class="label">
								<span class="label-text">Conversation Rectangle Width</span>
								<span class="label-text-alt text-primary font-semibold">{currentConfig.conversationRectWidth}</span>
							</label>
							<input
								type="range"
								min="1"
								max="20"
								step="1"
								bind:value={currentConfig.conversationRectWidth}
								on:input={(e) => handleConfigChange('conversationRectWidth', parseInt(e.target.value))}
								class="range range-primary"
							/>
						</div>
					</div>
				</div>

				<!-- Color Settings -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-lg mb-4">Color Options</h3>
						
						<div class="form-control">
							<label class="label cursor-pointer">
								<span class="label-text">Color Paths by Codes</span>
								<input
									type="checkbox"
									class="toggle toggle-primary"
									bind:checked={currentConfig.isPathColorMode}
									on:change={() => p5Instance?.loop()}
								/>
							</label>
							<span class="label-text-alt text-xs opacity-60">
								Use code colors instead of user colors for paths
							</span>
						</div>
					</div>
				</div>

				<!-- Toggle Settings -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-lg mb-4">Display Toggles</h3>
						
						<div class="grid grid-cols-2 gap-4">
							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text">Circle Toggle</span>
									<input
										type="checkbox"
										class="toggle toggle-primary"
										bind:checked={currentConfig.circleToggle}
										on:change={() => p5Instance?.loop()}
									/>
								</label>
							</div>

							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text">Slice Toggle</span>
									<input
										type="checkbox"
										class="toggle toggle-primary"
										bind:checked={currentConfig.sliceToggle}
										on:change={() => p5Instance?.loop()}
									/>
								</label>
							</div>

							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text">Movement Toggle</span>
									<input
										type="checkbox"
										class="toggle toggle-primary"
										bind:checked={currentConfig.movementToggle}
										on:change={() => p5Instance?.loop()}
									/>
								</label>
							</div>

							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text">Stops Toggle</span>
									<input
										type="checkbox"
										class="toggle toggle-primary"
										bind:checked={currentConfig.stopsToggle}
										on:change={() => p5Instance?.loop()}
									/>
								</label>
							</div>

							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text">Highlight Toggle</span>
									<input
										type="checkbox"
										class="toggle toggle-primary"
										bind:checked={currentConfig.highlightToggle}
										on:change={() => p5Instance?.loop()}
									/>
								</label>
							</div>

							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text">Align Toggle</span>
									<input
										type="checkbox"
										class="toggle toggle-primary"
										bind:checked={currentConfig.alignToggle}
										on:change={() => p5Instance?.loop()}
									/>
								</label>
							</div>
						</div>
					</div>
				</div>
			</div>

		{:else if activeTab === 'advanced'}
			<div class="space-y-6">
				<!-- Stop Detection -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-lg mb-4">Stop Detection</h3>
						
						<div class="form-control">
							<label class="label">
								<span class="label-text">Stop Threshold</span>
								<span class="label-text-alt text-primary font-semibold">{currentConfig.stopSliderValue}</span>
							</label>
							<input
								type="range"
								min="1"
								max={currentConfig.maxStopLength}
								step="1"
								bind:value={currentConfig.stopSliderValue}
								on:input={(e) => handleConfigChange('stopSliderValue', parseInt(e.target.value))}
								class="range range-primary"
							/>
							<div class="label-text-alt text-xs opacity-60 mt-1">
								Points with stop duration above this value are considered stops
							</div>
						</div>

						<div class="form-control mt-4">
							<label class="label">
								<span class="label-text">Max Stop Length</span>
								<span class="label-text-alt">{currentConfig.maxStopLength}</span>
							</label>
							<div class="label-text-alt text-xs opacity-60">
								Automatically calculated from data
							</div>
						</div>
					</div>
				</div>

				<!-- Search -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-lg mb-4">Search</h3>
						
						<div class="form-control">
							<label class="label">
								<span class="label-text">Word to Search</span>
							</label>
							<input
								type="text"
								placeholder="Enter search term..."
								bind:value={currentConfig.wordToSearch}
								on:input={(e) => handleConfigChange('wordToSearch', e.target.value)}
								class="input input-bordered"
							/>
						</div>
					</div>
				</div>

				<!-- Interpolation -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-lg mb-4">Playback Interpolation</h3>
						
						<div class="form-control">
							<label class="label cursor-pointer">
								<span class="label-text">Use Interpolation</span>
								<input
									type="checkbox"
									class="toggle toggle-primary"
									bind:checked={currentConfig.useInterpolation}
									on:change={() => p5Instance?.loop()}
								/>
							</label>
							<span class="label-text-alt text-xs opacity-60">
								Smooth playhead movement between data points
							</span>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<div class="modal-action border-t pt-4">
		<button class="btn btn-warning" on:click={resetSettings}>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
			</svg>
			Reset Settings
		</button>
		<button class="btn" on:click={closeModal}>Close</button>
	</div>
</div>

<style>
	.card {
		@apply shadow-sm;
	}
	
	.card-body {
		@apply p-4;
	}
	
	.form-control + .form-control {
		@apply mt-2;
	}
</style>