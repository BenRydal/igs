import { writable } from 'svelte/store';

const CodeStore = writable<string[]>([]);

export default CodeStore;
