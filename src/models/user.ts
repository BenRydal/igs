import type { DataPoint } from './dataPoint'

/**
 * Source of revision stamps. Monotonic and process-wide, never reset.
 *
 * Must stay global rather than per-user. Derived-data caches key on
 * `name:revision`, and with a per-user counter the stamp is a deterministic
 * function of how many files a dataset loaded — so two datasets holding the same
 * user names produce identical keys, and switching between them serves the
 * previous dataset's cached data. A global counter makes a stamp unique across
 * every user and every load.
 */
let revisionCounter = 0

/** Next unique revision stamp. Use this instead of incrementing in place. */
export function nextRevision(): number {
  return ++revisionCounter
}

export class User {
  enabled: boolean // Whether the user is enabled
  conversation_enabled: boolean // Whether the user's conversation
  name: string // Name of the user
  color: string // Color of the user's trail
  dataTrail: DataPoint[] // Array of Data points
  movementIsLoaded: boolean // Whether the user's movement data is loaded
  conversationIsLoaded: boolean // Whether the user's conversation data is loaded
  /**
   * Restamped from nextRevision() whenever dataTrail's contents change —
   * including in-place edits that leave its length untouched (a transcript
   * time/text edit, clearing speech or codes). Derived-data caches key on this
   * instead of dataTrail.length, which cannot see those edits. User-level
   * scalars such as `color` are cheap enough to put in a cache key directly and
   * deliberately do NOT restamp this.
   *
   * Assign with `user.revision = nextRevision()`, never `user.revision++`: the
   * value's uniqueness is what makes it safe as a cache key.
   */
  revision: number

  constructor(dataTrail: DataPoint[], color: string, enabled = true, name = '') {
    this.enabled = enabled
    this.conversation_enabled = enabled
    this.name = name
    this.color = color
    this.dataTrail = dataTrail
    this.movementIsLoaded = false
    this.conversationIsLoaded = false
    this.revision = nextRevision()
  }
}
