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
	isAlignTalk: boolean;
	isAllTalk: boolean;
}

const initialConfig: ConfigStoreType = {
	isPathColorMode: false,
	dataHasCodes: false,
	circleToggle: false,
	sliceToggle: false,
	movementToggle: false,
	stopsToggle: false,
	highlightToggle: false,
	maxStopLength: 0,
	stopSliderValue: 1,
	isAlignTalk: true,
	isAllTalk: true
};

const ConfigStore = writable<ConfigStoreType>(initialConfig);

export default ConfigStore;
