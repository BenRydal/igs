import { writable } from 'svelte/store'
import type { User } from '../models/user'

type UserStoreState = User[]

const UserStore = writable<UserStoreState>(new Array<User>())

export default UserStore
