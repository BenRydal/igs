import { writable } from 'svelte/store';

interface CodeEntry {
	code: string;
	color: string;
}

const CodeStore = writable<CodeEntry[]>([]);

export default CodeStore;
