import { writable } from 'svelte/store';
import type { Core } from '$lib/core';
import type { VideoController } from '$lib';

// Define an interface for your global store state if you're using TypeScript
export interface P5Store {
	core: Core | null;
	videoController: VideoController | null;
	// Add other properties here as needed
	// otherProperty: OtherType | null;
}

// Create the initial state
const initialState: P5Store = {
	core: null,
	videoController: null
	// Initialize other properties here
	// otherProperty: null,
};

const P5Store = writable(initialState);

export default P5Store;
