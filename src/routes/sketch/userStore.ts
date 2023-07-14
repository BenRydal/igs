import { writable } from 'svelte/store';
import type { User } from './user';

const UserStore = writable(new Array<User>())

export default UserStore;