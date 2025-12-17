import { writable } from 'svelte/store'
import type { User } from '../models/user'

export type UserStoreState = User[]

const UserStore = writable<UserStoreState>(new Array<User>())

export default UserStore
