/**
 * This class holds different utility and helper methods used in draw movement and conversation classes
 * It centralizes decisions about what points to show and not show and is coupled with the sketchController/gui classes
 */
export class DrawUtils {

    constructor(sketch, codeList) {
        this.sk = sketch;
        this.codeList = codeList;
    }

    /**
     * Holds tests for determining if point is visible (e.g., selected, highlighted)
     */
    isVisible(point, curPos) {
        return (this.isShowingInGUI(curPos.timelineXPos) && this.selectMode(curPos, point.isStopped) && this.isShowingInCodeList(point.codes.hasCodeArray));
    }

    isShowingInGUI(pixelTime) {
        return this.sk.gui.timelinePanel.overAxis(pixelTime) && this.isShowingInAnimation(pixelTime);
    }

    isShowingInAnimation(value) {
        if (this.sk.sketchController.getIsAnimate()) return this.sk.sketchController.animationCounter > this.sk.sketchController.mapPixelTimeToTotalTime(value);
        else return true;
    }

    /**
     * This method tests if a point is showing for all selected codes from codeList
     * IMPLEMENTATION: Iterate through codeList and return false if: for any of codes that are true in codeList a code at curPoint is false 
     * @param  {MovementPoint} point
     */
    isShowingInCodeList(codesArray) {
        if (this.sk.arrayIsLoaded(this.codeList)) {
            for (let j = 0; j < this.codeList.length; j++) {
                if (this.codeList[j].isShowing) {
                    if (codesArray[j]) continue;
                    else return false;
                }
            }
        }
        return true;
    }

    /**
     * @param  {Movement/Conversation Pos Object} curPos
     * @param  {boolean} pointIsStopped
     */
    selectMode(curPos, isStopped) {
        switch (this.sk.sketchController.getCurSelectTab()) {
            case 0:
                return true;
            case 1:
                if (this.sk.handle3D.getIs3DModeOrTransitioning()) return true;
                else return this.sk.gui.fpContainer.overCursor(curPos.floorPlanXPos, curPos.floorPlanYPos, curPos.selTimelineXPos) && this.sk.gui.highlight.overHighlightArray(curPos.floorPlanXPos, curPos.floorPlanYPos, curPos.selTimelineXPos);
            case 2:
                if (this.sk.handle3D.getIs3DModeOrTransitioning()) return true;
                else return this.sk.gui.fpContainer.overSlicer(curPos.floorPlanXPos, curPos.selTimelineXPos) && this.sk.gui.highlight.overHighlightArray(curPos.floorPlanXPos, curPos.floorPlanYPos, curPos.selTimelineXPos);
            case 3:
                return !isStopped && this.sk.gui.highlight.overHighlightArray(curPos.floorPlanXPos, curPos.floorPlanYPos, curPos.selTimelineXPos);
            case 4:
                return isStopped && this.sk.gui.highlight.overHighlightArray(curPos.floorPlanXPos, curPos.floorPlanYPos, curPos.selTimelineXPos);
            case 5:
                return this.sk.gui.highlight.overHighlightArray(curPos.floorPlanXPos, curPos.floorPlanYPos, curPos.timelineXPos);
        }
    }

    /**
     * A compare point is an object with two augmented points
     * @param  {Integer} view
     * @param  {MovementPoint} curIndex 
     * @param  {MovementPoint} priorIndex 
     */
    createComparePoint(view, curIndex, priorIndex) {
        return {
            cur: this.createAugmentPoint(view, curIndex),
            prior: this.createAugmentPoint(view, priorIndex)
        }
    }

    createAugmentPoint(view, point) {
        return {
            point,
            pos: this.getScaledMovementPos(point, view)
        }
    }

    /**
     * Returns scaled pixel values for a point to graphical display
     * IMPORTANT: currently view parameter can be either one of 2 constants or "null" for conversation drawing
     * @param  {Movement Or Conversation Point} point
     * @param  {Integer} view
     */
    getSharedPosValues(point) {
        const timelineXPos = this.sk.sketchController.mapTotalTimeToPixelTime(point.time);
        const selTimelineXPos = this.sk.sketchController.mapSelectTimeToPixelTime(timelineXPos);
        const [floorPlanXPos, floorPlanYPos] = this.sk.floorPlan.getScaledXYPos(point.xPos, point.yPos, this.sk.gui.fpContainer.getContainer());
        return {
            timelineXPos,
            selTimelineXPos,
            floorPlanXPos,
            floorPlanYPos,
        };
    }

    /**
     * @param  {MovementPoint} point
     * @param  {Integer} view
     */
    getScaledMovementPos(point, view) {
        const pos = this.getSharedPosValues(point);
        return {
            timelineXPos: pos.timelineXPos,
            selTimelineXPos: pos.selTimelineXPos,
            floorPlanXPos: pos.floorPlanXPos,
            floorPlanYPos: pos.floorPlanYPos,
            viewXPos: this.getViewXPos(view, pos.floorPlanXPos, pos.selTimelineXPos),
            zPos: this.getZPos(view, pos.selTimelineXPos)
        };
    }

    getScaledConversationPos(point) {
        const pos = this.getSharedPosValues(point);
        const rectLength = this.sk.constrain(point.talkTurn.length / 2, 3, 175); // 3 and 175 set min and max pixel dimensions
        return {
            timelineXPos: pos.timelineXPos,
            selTimelineXPos: pos.selTimelineXPos,
            floorPlanXPos: pos.floorPlanXPos,
            floorPlanYPos: pos.floorPlanYPos,
            rectLength,
            adjustYPos: this.getConversationAdjustYPos(pos.floorPlanYPos, rectLength)
        };
    }

    getViewXPos(view, floorPlanXPos, selTimelineXPos) {
        if (view === this.sk.PLAN) return floorPlanXPos;
        else {
            if (this.sk.handle3D.getIs3DMode()) return floorPlanXPos;
            else return selTimelineXPos;
        }
    }

    getZPos(view, selTimelineXPos) {
        if (view === this.sk.PLAN) return 0;
        else {
            if (this.sk.handle3D.getIs3DMode()) return selTimelineXPos;
            else return 0;
        }
    }

    /**
     * Adjusts Y positioning of conversation rectangles correctly for align and 3 D views
     */
    getConversationAdjustYPos(floorPlanYPos, rectLength) {
        if (this.sk.sketchController.getIsAlignTalk()) {
            if (this.sk.handle3D.getIs3DMode()) return this.sk.gui.fpContainer.getContainer().height;
            else return 0;
        } else if (this.sk.handle3D.getIs3DMode()) {
            return floorPlanYPos;
        } else return floorPlanYPos - rectLength;
    }

}