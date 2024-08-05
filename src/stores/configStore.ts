import { writable } from 'svelte/store';

// Generate docs for each variable

// isPathColorMode: boolean
// Whether the path color mode is enabled or not.
//
// dataHasCodes: boolean
// Whether or not the data imported contains any code files
const ConfigStore = writable({
	isPathColorMode: false,
	dataHasCodes: false,
	// options under additional options
	circleToggle: false,
	sliceToggle: false,
	movementToggle: false,
	stopsToggle: false,
	highlightToggle: false,
	stopLengthValue: 0,
	stopLengthMax: 0
});

export default ConfigStore;
