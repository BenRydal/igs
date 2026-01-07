import type { DataPoint } from './dataPoint'

export class User {
  enabled: boolean // Whether the user is enabled
  conversation_enabled: boolean // Whether the user's conversation
  name: string // Name of the user
  color: string // Color of the user's trail
  dataTrail: DataPoint[] // Array of Data points
  movementIsLoaded: boolean // Whether the user's movement data is loaded
  conversationIsLoaded: boolean // Whether the user's conversation data is loaded

  constructor(
    dataTrail: DataPoint[],
    color: string,
    enabled = true,
    name = ''
  ) {
    this.enabled = enabled
    this.conversation_enabled = enabled
    this.name = name
    this.color = color
    this.dataTrail = dataTrail
    this.movementIsLoaded = false
    this.conversationIsLoaded = false
  }
}
