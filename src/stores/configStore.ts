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

	// For now just check the number
	curSelectTab: 0,
	// circleToggle: false,
	// sliceToggle: false,
	// movementToggle: false,
	// stopsToggle: false,
	// highlightToggle: false,
	maxStopLength: 0
});

export default ConfigStore;
