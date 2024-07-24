import { writable } from 'svelte/store';

// Generate docs for each variable

// isPathColorMode: boolean
// Whether the path color mode is enabled or not.
//
// dataHasCodes: boolean
// Whether or not the data imported contains any code files
const ConfigStore = writable({
	isPathColorMode: false,
	dataHasCodes: false
});

export default ConfigStore;
