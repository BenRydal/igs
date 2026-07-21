/**
 * This class holds different utility and helper methods used in draw movement and conversation classes
 */

import { timelineV2Store } from '../timeline/store'
import CodeStore from '../../stores/codeStore'
import { get } from 'svelte/store'
import { drawState } from './draw-state'

// Shared constants for conversation rect sizing
export const MIN_RECT_SIZE = 15
export const MAX_RECT_SIZE = 80

export class DrawUtils {
  constructor(sketch) {
    this.sk = sketch
  }

  setCodeColor(searchCodes) {
    const entries = get(CodeStore)

    // Handle data points with no codes - look up the "no codes" entry color
    if (searchCodes.length === 0) {
      const noCodesEntry = entries.find((e) => e.code === 'no codes')
      return noCodesEntry ? noCodesEntry.color : '#808080'
    }

    let matchedEntries = entries.filter((e) => searchCodes.includes(e.code))

    if (matchedEntries.length === 1) {
      return matchedEntries[0].color
    } else if (matchedEntries.length > 1) {
      // TODO: If we find a new way to manage multiple codes, this is where
      // that change would be. Currently default multiple codes to black.
      return '#000000'
    } else {
      return '#808080' // Default color if no codes match
    }
  }

  isShowingInCodeList(codesArray) {
    const entries = get(CodeStore)
    if (codesArray.length === 0) {
      // Handle data points with no codes
      const noCodesEntry = entries.find((entry) => entry.code === 'no codes')
      return noCodesEntry ? noCodesEntry.enabled : true
    } else {
      return entries.some((entry) => codesArray.includes(entry.code) && entry.enabled)
    }
  }

  isVisible(point, curPos, stopLength) {
    return (
      this.isShowingInGUI(curPos.timelineXPos) &&
      this.selectMode(curPos, this.isStopped(stopLength)) &&
      this.isShowingInCodeList(point.codes)
    )
  }

  isStopped(stopLength) {
    return stopLength >= drawState.config.stopSliderValue
  }

  isShowingInGUI(pixelTime) {
    return timelineV2Store.overAxis(pixelTime) && this.isShowingInAnimation(pixelTime)
  }

  isShowingInAnimation(value) {
    if (drawState.playbackMode !== 'stopped') {
      const state = timelineV2Store.getState()
      return timelineV2Store.pixelToTime(value) < state.currentTime
    }
    return true
  }

  selectMode(curPos, pointIsStopped) {
    const { floorPlanXPos, floorPlanYPos, selTimelineXPos, timelineXPos } = curPos
    const is3DMode = this.sk.handle3D.getIs3DModeOrTransitioning()

    if (drawState.config.circleToggle) {
      if (is3DMode) return true
      return this.sk.gui.fpContainer.overCursor(floorPlanXPos, floorPlanYPos, selTimelineXPos)
    }

    if (drawState.config.sliceToggle) {
      if (is3DMode) return true
      return this.sk.gui.fpContainer.overSlicer(floorPlanXPos, selTimelineXPos)
    }

    if (drawState.config.movementToggle) {
      return !pointIsStopped
    }

    if (drawState.config.stopsToggle) {
      return pointIsStopped
    }

    if (drawState.config.highlightToggle) {
      return this.sk.gui.highlight.overHighlightArray(floorPlanXPos, floorPlanYPos, timelineXPos)
    }

    return true
  }

  createAugmentPoint(view, point, time) {
    return {
      point,
      pos: this.getScaledMovementPos(point, view, time),
    }
  }

  /**
   * Returns scaled pixel values for a point to graphical display
   * IMPORTANT: currently view parameter can be either one of 2 constants or "null" for conversation drawing
   * @param  {Movement Or Conversation Point} point
   * @param  {Integer} time
   */
  getSharedPosValues(point, time) {
    const timelineXPos = timelineV2Store.timeToPixel(time)
    const selTimelineXPos = this.sk.mapSelectTimeToPixelTime(timelineXPos)
    const [floorPlanXPos, floorPlanYPos] = this.sk.floorPlan.getScaledXYPos(
      point.x,
      point.y,
      this.sk.gui.fpContainer.getContainer()
    )
    return {
      timelineXPos,
      selTimelineXPos,
      floorPlanXPos,
      floorPlanYPos,
    }
  }

  /**
   * @param  {MovementPoint} point
   * @param  {Integer} view
   */
  getScaledMovementPos(point, view, time) {
    const pos = this.getSharedPosValues(point, time)
    return {
      timelineXPos: pos.timelineXPos,
      selTimelineXPos: pos.selTimelineXPos,
      floorPlanXPos: pos.floorPlanXPos,
      floorPlanYPos: pos.floorPlanYPos,
      viewXPos: this.getViewXPos(view, pos.floorPlanXPos, pos.selTimelineXPos),
      zPos: this.getZPos(view, pos.selTimelineXPos),
    }
  }

  getScaledConversationPos(point) {
    const pos = this.getSharedPosValues(point, point.time)
    // Height: content length (how much text)
    const rectHeight = this.sk.map(
      point.speech.length,
      0,
      drawState.config.maxTurnLength,
      MIN_RECT_SIZE,
      MAX_RECT_SIZE
    )
    return {
      timelineXPos: pos.timelineXPos,
      selTimelineXPos: pos.selTimelineXPos,
      floorPlanXPos: pos.floorPlanXPos,
      floorPlanYPos: pos.floorPlanYPos,
      rectHeight,
      rectWidth: drawState.config.conversationRectWidth,
      adjustYPos: this.getConversationAdjustYPos(pos.floorPlanYPos, rectHeight),
    }
  }

  getViewXPos(view, floorPlanXPos, selTimelineXPos) {
    if (view === this.sk.PLAN) return floorPlanXPos
    else {
      if (this.sk.handle3D.getIs3DMode()) return floorPlanXPos
      else return selTimelineXPos
    }
  }

  getZPos(view, selTimelineXPos) {
    if (view === this.sk.PLAN) return 0
    else {
      if (this.sk.handle3D.getIs3DMode()) return selTimelineXPos
      else return 0
    }
  }

  /**
   * Adjusts Y positioning of conversation rectangles correctly for align and 3 D views
   */
  getConversationAdjustYPos(floorPlanYPos, rectLength) {
    if (drawState.config.alignToggle) {
      if (this.sk.handle3D.getIs3DMode()) return this.sk.gui.fpContainer.getContainer().height
      else return 0
    } else if (this.sk.handle3D.getIs3DMode()) {
      return floorPlanYPos
    } else return floorPlanYPos - rectLength
  }
}
