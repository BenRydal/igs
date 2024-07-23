// Using this to calculate the window width and dropdown postiion to be dynamic

import { writable } from 'svelte/store';

export const windowWidth = writable(typeof window !== 'undefined' ? window.innerWidth : 0);

if (typeof window !== 'undefined') {
	window.addEventListener('resize', () => {
		windowWidth.set(window.innerWidth);
	});
}
