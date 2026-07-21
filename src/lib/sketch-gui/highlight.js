import { timelineV2Store } from '../timeline/store'

/** @typedef {import('../p5/igs-p5').IgsP5} IgsP5 */
/** @typedef {{ xPos: number, yPos: number, width: number, height: number }} HighlightRect */

export class Highlight {
  /**
   * @param {IgsP5} sketch
   * @param {number} bottomBounds
   */
  constructor(sketch, bottomBounds) {
    this.sk = sketch
    /** @type {number | null} */
    this.curXTop = null // top corner of highlight region
    /** @type {number | null} */
    this.curYTop = null
    /** @type {HighlightRect[]} holds pixel positions of user drawn rectangles */
    this.highlightArray = []
    this.bounds = {
      // currently the canvas boundary
      xPos: 0,
      yPos: 0,
      width: sketch.width,
      height: bottomBounds,
    }
  }

  /**
   * Record top corner of highlight region if mousePressed within Canvas boundary
   */
  handleMousePressed() {
    if (this.overBounds()) {
      this.curXTop = this.sk.mouseX
      this.curYTop = this.sk.mouseY
    }
  }

  /**
   * Update highlightArray if mouseReleased within Canvas boundary
   * NOTE: if option key is held, multiple highlightRects can be added to highlightArray
   * Always reset curX/Y top
   */
  handleMouseRelease() {
    if (this.overBounds()) {
      if (!(this.sk.keyIsPressed && this.sk.keyCode === this.sk.OPTION)) this.resetHighlightArray()
      if (this.isHighlighting()) this.highlightArray.push(this.createHighlightRect())
    }
    this.resetCurHighlight()
  }

  /**
   * Returns top corner and width/height of user drawn selection rectangle dragged in any direction
   */
  createHighlightRect() {
    // Only called while isHighlighting() (curX/YTop non-null)
    const xTop = this.curXTop ?? 0
    const yTop = this.curYTop ?? 0
    return {
      xPos: Math.min(xTop, this.sk.mouseX),
      yPos: Math.min(yTop, this.sk.mouseY),
      width: Math.abs(this.sk.mouseX - xTop),
      height: Math.abs(this.sk.mouseY - yTop),
    }
  }

  setDraw() {
    this.sk.noFill()
    this.sk.stroke(0)
    this.sk.strokeWeight(1)
    if (this.isHighlighting()) this.drawCurHighlight()
    this.sk.stroke(150)
    for (const highlightRect of this.highlightArray) this.drawHighlightRects(highlightRect)
  }

  /**
   * Current highlight being recorded is drawn simply as a rectangle based on user mouse position and a starting point
   */
  drawCurHighlight() {
    // Only called while isHighlighting() (curX/YTop non-null)
    const xTop = this.curXTop ?? 0
    const yTop = this.curYTop ?? 0
    this.sk.rect(xTop, yTop, this.sk.mouseX - xTop, this.sk.mouseY - yTop)
  }

  /**
   * Organizes drawing of rects in 2D or 3D
   * NOTE: Simple rectangle can be used to draw all highlightRects in 2D and also in 3D if it was not highlighted in space-time/over the timeline
   * @param  {HighlightRect} highlightRect
   */
  drawHighlightRects(highlightRect) {
    // highlightRect is canvas-space; overAxis expects viewport pixels
    if (
      this.sk.handle3D.getIs3DMode() &&
      timelineV2Store.overAxis(highlightRect.xPos + this.sk.canvasLeft)
    ) {
      this.draw3DHighlightRect(highlightRect)
    } else {
      this.sk.rect(
        highlightRect.xPos,
        highlightRect.yPos,
        highlightRect.width,
        highlightRect.height
      )
    }
  }

  /**
   * Draws 3D cube corresponding to time selected by user (vertical axis)
   * NOTE: rect is drawn across entire floorPlan along the x dimension/axis while the y is constrained to user selection (in other words, a user can't select portions of the x axis when user highlights over the timeline)
   */
  /** @param {HighlightRect} highlightRect */
  draw3DHighlightRect(highlightRect) {
    // Map method maintains highlight rect scaling if user adjusts timeline.
    // The map functions take viewport pixels; highlightRect is canvas-space.
    const zPosStart = this.sk.mapToSelectTimeThenPixelTime(highlightRect.xPos + this.sk.canvasLeft)
    const zPosEnd = this.sk.mapToSelectTimeThenPixelTime(
      highlightRect.xPos + highlightRect.width + this.sk.canvasLeft
    )

    const span = this.sk.gui.fpContainer.getContainer().width // span 3D rects full span of floor plan container
    // cube top
    this.sk.quad(
      0,
      highlightRect.yPos,
      zPosEnd,
      span,
      highlightRect.yPos,
      zPosEnd,
      span,
      highlightRect.yPos + highlightRect.height,
      zPosEnd,
      0,
      highlightRect.yPos + highlightRect.height,
      zPosEnd
    )
    // cube bottom
    this.sk.quad(
      0,
      highlightRect.yPos,
      zPosStart,
      span,
      highlightRect.yPos,
      zPosStart,
      span,
      highlightRect.yPos + highlightRect.height,
      zPosStart,
      0,
      highlightRect.yPos + highlightRect.height,
      zPosStart
    )
    // connectors
    this.sk.line(0, highlightRect.yPos, zPosEnd, 0, highlightRect.yPos, zPosStart)
    this.sk.line(span, highlightRect.yPos, zPosEnd, span, highlightRect.yPos, zPosStart)
    this.sk.line(
      0,
      highlightRect.yPos + highlightRect.height,
      zPosEnd,
      0,
      highlightRect.yPos + highlightRect.height,
      zPosStart
    )
    this.sk.line(
      span,
      highlightRect.yPos + highlightRect.height,
      zPosEnd,
      span,
      highlightRect.yPos + highlightRect.height,
      zPosStart
    )
  }

  /**
   * Called from draw movement/conversation methods (params are numbers from CurPos object)
   * Returns true if no highlightRects or if data is within bounds of a highlighRect
   */
  /**
   * @param {number} xPos
   * @param {number} yPos
   * @param {number} xPosTime
   */
  overHighlightArray(xPos, yPos, xPosTime) {
    if (!this.highlightArray.length)
      return true // return true if no data
    else {
      for (const highlightRect of this.highlightArray) {
        if (this.overHighlightRect(highlightRect, xPos, yPos, xPosTime)) return true
      }
      return false
    }
  }

  /**
   * NOTE: If in 3D mode, you need to first test if highlightRect was selected on floor plan or timeline
   */
  /**
   * @param {HighlightRect} highlightRect
   * @param {number} xPos
   * @param {number} yPos
   * @param {number} xPosTimeToMap
   */
  overHighlightRect(highlightRect, xPos, yPos, xPosTimeToMap) {
    // Map method maintains highlight rect scaling if user adjusts timeline.
    // xPosTimeToMap is a viewport pixel; highlightRect is canvas-space, so
    // the zoom-adjusted result must be shifted into canvas coordinates.
    const xPosTime = timelineV2Store.viewPixelToPixel(xPosTimeToMap) - this.sk.canvasLeft
    if (this.sk.handle3D.getIs3DMode()) {
      if (timelineV2Store.overAxis(highlightRect.xPos + this.sk.canvasLeft))
        return this.betweenX(xPosTime, highlightRect) && this.betweenY(yPos, highlightRect)
      else return this.betweenX(xPos, highlightRect) && this.betweenY(yPos, highlightRect)
    } else {
      return (
        (this.betweenX(xPos, highlightRect) || this.betweenX(xPosTime, highlightRect)) &&
        this.betweenY(yPos, highlightRect)
      )
    }
  }

  /**
   * @param {number} xPos
   * @param {HighlightRect} highlightRect
   */
  betweenX(xPos, highlightRect) {
    return xPos >= highlightRect.xPos && xPos <= highlightRect.xPos + highlightRect.width
  }

  /**
   * @param {number} yPos
   * @param {HighlightRect} highlightRect
   */
  betweenY(yPos, highlightRect) {
    return yPos >= highlightRect.yPos && yPos <= highlightRect.yPos + highlightRect.height
  }

  isHighlighting() {
    return this.curXTop !== null && this.curYTop !== null
  }

  resetHighlightArray() {
    this.highlightArray = []
  }

  resetCurHighlight() {
    this.curXTop = null
    this.curYTop = null
  }

  overBounds() {
    return this.sk.overRect(
      this.bounds.xPos,
      this.bounds.yPos,
      this.bounds.width,
      this.bounds.height
    )
  }
}
