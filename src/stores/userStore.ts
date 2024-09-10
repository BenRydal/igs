import { writable } from 'svelte/store';
import type { User } from '../models/user';

const UserStore = writable(new Array<User>());

export default UserStore;
