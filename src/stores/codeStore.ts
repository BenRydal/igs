import { writable } from 'svelte/store';

interface CodeEntry {
	enabled: boolean;
	code: string;
	color: string;
}

const CodeStore = writable<CodeEntry[]>([]);

export default CodeStore;
