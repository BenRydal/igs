/**
 * Prepares and draws movement and conversation data.
 * Merges conversation data from all users chronologically for proper z-ordering.
 */

import { DrawMovement } from './draw-movement.js'
import { DrawConversation } from './draw-conversation.js'
import { DrawUtils } from './draw-utils.js'

export class SetPathData {
  constructor(sketch) {
    this.sk = sketch
    this.drawUtils = new DrawUtils(sketch)
    this.mergedConversationCache = null
    this.cacheKey = null
  }

  setMovementAndConversation(userList) {
    const drawConversation = new DrawConversation(this.sk, this.drawUtils)
    const drawMovement = new DrawMovement(this.sk, this.drawUtils)

    DrawConversation.clearHoverState()

    // Draw conversations (merged chronologically)
    const conversationUsers = userList.filter(
      (u) => u.conversation_enabled && u.conversationIsLoaded
    )
    if (conversationUsers.length) {
      const cacheKey = conversationUsers.map((u) => `${u.name}:${u.dataTrail.length}`).join('|')
      if (this.cacheKey !== cacheKey) {
        this.mergedConversationCache = this.mergeConversationData(conversationUsers)
        this.cacheKey = cacheKey
      }
      drawConversation.drawAllConversations(this.mergedConversationCache)
    }

    // Draw movement after conversation so dots display on top
    for (const user of userList) {
      if (user.enabled && user.movementIsLoaded) {
        drawMovement.setData(user)
      }
    }
  }

  /**
   * K-way merge of pre-sorted user dataTrails into single time-sorted array.
   * Only includes points with speech. O(n) since inputs are already sorted.
   */
  mergeConversationData(users) {
    const iterators = users.map((user) => ({
      trail: user.dataTrail,
      idx: 0,
      speaker: user.name,
      color: user.color,
    }))

    const merged = []

    while (true) {
      let minTime = Infinity
      let minIt = null

      for (const it of iterators) {
        // Skip points without speech
        while (it.idx < it.trail.length && !it.trail[it.idx].speech) it.idx++

        if (it.idx < it.trail.length && it.trail[it.idx].time < minTime) {
          minTime = it.trail[it.idx].time
          minIt = it
        }
      }

      if (!minIt) break

      merged.push({
        point: minIt.trail[minIt.idx],
        speaker: minIt.speaker,
        color: minIt.color,
      })
      minIt.idx++
    }

    return merged
  }

  getCodeFileArrays(dataTrail) {
    if (dataTrail.length < 2) {
      console.error('dataTrail must contain at least two elements.')
      return [[], []]
    }

    const startTimes = []
    const endTimes = []
    let recording = false

    for (let i = 1; i < dataTrail.length; i++) {
      const point = dataTrail[i]
      const augmented = this.drawUtils.createAugmentPoint(this.sk.PLAN, point, point.time)
      const visible = this.drawUtils.isVisible(
        augmented.point,
        augmented.pos,
        augmented.point.stopLength
      )

      if (visible && !recording) {
        recording = true
        startTimes.push(point.time)
      } else if (!visible && recording) {
        recording = false
        endTimes.push(dataTrail[i - 1].time)
      }

      if (i === dataTrail.length - 1 && recording) {
        endTimes.push(point.time)
      }
    }

    return [startTimes, endTimes]
  }
}
