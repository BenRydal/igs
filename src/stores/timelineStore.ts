import { writable } from 'svelte/store';
import { Timeline } from '../models/timeline';

const TimelineStore = writable(new Timeline());
export default TimelineStore;