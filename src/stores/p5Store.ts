import { writable } from 'svelte/store';
import type p5 from 'p5';

const P5Store = writable<p5 | null>(null);

export default P5Store;
