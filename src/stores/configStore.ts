import { writable } from 'svelte/store';

export interface ConfigStoreType {
	isPathColorMode: boolean;
	dataHasCodes: boolean;
	circleToggle: boolean;
	sliceToggle: boolean;
	movementToggle: boolean;
	stopsToggle: boolean;
	highlightToggle: boolean;
	maxStopLength: number;
	stopSliderValue: number;
	alignToggle: boolean;
	wordToSearch: string;
	animationRate: number;
	samplingInterval: number;
	smallDataThreshold: number;
	conversationRectWidth: number;
	movementStrokeWeight: number;
	stopStrokeWeight: number;
	optimizationDistance: number;
	preserveStops: boolean;
	useOptimizedTrail: boolean;
	stopSamplingEnabled: boolean;
	stopSamplingInterval: number;
	aggressiveOptimization: boolean;
	codeSamplingEnabled: boolean;
	codeSamplingInterval: number;
}

export const initialConfig: ConfigStoreType = {
	isPathColorMode: false,
	dataHasCodes: false,
	circleToggle: false,
	sliceToggle: false,
	movementToggle: false,
	stopsToggle: false,
	highlightToggle: false,
	maxStopLength: 0,
	stopSliderValue: 1,
	alignToggle: true,
	wordToSearch: '',
	animationRate: 0.05,
	samplingInterval: 0.5,
	smallDataThreshold: 3000,
	conversationRectWidth: 5,
	movementStrokeWeight: 1,
	stopStrokeWeight: 9,
	optimizationDistance: 5,
	preserveStops: true,
	useOptimizedTrail: true,
	stopSamplingEnabled: true,
	stopSamplingInterval: 5,
	aggressiveOptimization: true,
	codeSamplingEnabled: true,
	codeSamplingInterval: 10
};

const ConfigStore = writable<ConfigStoreType>(initialConfig);

export default ConfigStore;
