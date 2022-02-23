/**
 * This class holds different utility and helper methods used in draw movement and conversation classes
 * It centralizes decisions about what points to show and not show and is coupled with the sketchController/gui classes
 */
class TestPoint {

    constructor(sketch) {
        this.sk = sketch;
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
     * IMPLEMENTATION: Iterate through core codeList and return false if: for any of codes that are true in codeList a code at curPoint is false 
     * @param  {MovementPoint} point
     */
    isShowingInCodeList(codesArray) {
        if (this.sk.arrayIsLoaded(this.sk.core.codeList)) {
            for (let j = 0; j < this.sk.core.codeList.length; j++) {
                if (this.sk.core.codeList[j].isShowing) {
                    if (codesArray[j]) continue;
                    else return false;
                }
            }
        }
        return true;
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
}