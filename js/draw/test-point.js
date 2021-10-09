/**
 * This class holds different tests and helper methods used in draw movement and conversation classes
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
     * Currently returns whether color by paths/people is selected in GUI
     */
    getColorMode() {
        return this.sk.gui.dataPanel.getCurColorTab() === 0;
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

    getScaledPos(point, view) {
        const timelineXPos = this.sk.sketchController.mapTotalTimeToPixelTime(point.time);
        const selTimelineXPos = this.sk.sketchController.mapSelectTimeToPixelTime(timelineXPos);
        const [floorPlanXPos, floorPlanYPos] = this.sk.sketchController.handleRotation.getScaledXYPos(point.xPos, point.yPos, this.sk.gui.fpContainer.getContainer(), this.sk.core.inputFloorPlan.getParams());
        return {
            timelineXPos,
            selTimelineXPos,
            floorPlanXPos,
            floorPlanYPos,
            viewXPos: this.getViewXPos(view, floorPlanXPos, selTimelineXPos),
            zPos: this.getZPos(view, selTimelineXPos)
        };
    }

    getViewXPos(view, floorPlanXPos, selTimelineXPos) {
        if (view === this.sk.PLAN) return floorPlanXPos;
        else {
            if (this.sk.sketchController.handle3D.getIsShowing()) return floorPlanXPos;
            else return selTimelineXPos;
        }
    }

    getZPos(view, selTimelineXPos) {
        if (view === this.sk.PLAN) return 0;
        else {
            if (this.sk.sketchController.handle3D.getIsShowing()) return selTimelineXPos;
            else return 0;
        }
    }

    /**
     * @param  {Integer} view
     * @param  {MovementPoint} curPoint
     */
    isPlanViewAndStopped(view, pointIsStopped) {
        return (view === this.sk.PLAN && pointIsStopped && this.sk.gui.dataPanel.getCurSelectTab() !== 3);
    }

    /**
     * Controls fat line drawing/segmentation
     * @param  {Object returned from getScaledPos} pos
     * @param  {MovementPoint} point
     */
    selectModeForFatLine(pos, pointIsStopped) {
        switch (this.sk.gui.dataPanel.getCurSelectTab()) {
            case 1:
                return this.sk.gui.fpContainer.overCursor(pos.floorPlanXPos, pos.floorPlanYPos);
            case 2:
                return this.sk.gui.fpContainer.overSlicer(pos.floorPlanXPos, pos.floorPlanYPos);
            default:
                return pointIsStopped; // this always returns false for floorplan view
        }
    }
    /**
     * Controls conversation drawing based on selectMode
     * @param  {Object returned from getScaledPos} pos
     * @param  {MovementPoint} point
     */
    selectModeForConversation(xPos, yPos, isStopped) {
        switch (this.sk.gui.dataPanel.getCurSelectTab()) {
            case 0:
                return true;
            case 1:
                return this.sk.gui.fpContainer.overCursor(xPos, yPos);
            case 2:
                return this.sk.gui.fpContainer.overSlicer(xPos, yPos);
            case 3:
                return !isStopped;
            case 4:
                return isStopped;
        }
    }

    selectModeForStrokeWeights() {
        switch (this.sk.gui.dataPanel.getCurSelectTab()) {
            case 3:
                return [1, 0];
            case 4:
                return [0, 9];
            default:
                return [1, 9];
        }
    }
    /**
     * Determines whether new dot should be created to display depending on animate, video or mouse position
     * NOTE: returns null if no newDot is created
     * @param  {Object returned from getScaledPos} curPos
     * @param  {Dot} curDot
     */
    getNewDot(curPos, curDot) {
        const [xPos, yPos, zPos, timePos, map3DMouse] = [curPos.floorPlanXPos, curPos.floorPlanYPos, curPos.zPos, curPos.selTimelineXPos, this.sk.sketchController.mapToSelectTimeThenPixelTime(this.sk.mouseX)];
        if (this.sk.sketchController.getIsAnimate()) {
            return this.createDot(xPos, yPos, zPos, timePos, null); // always return true to set last/most recent point as the dot
        } else if (this.sk.sketchController.mode.isVideoPlay) {
            const videoToSelectTime = this.sk.sketchController.mapVideoTimeToSelectedTime();
            if (this.compareToCurDot(videoToSelectTime, timePos, curDot)) return this.createDot(xPos, yPos, zPos, timePos, Math.abs(videoToSelectTime - timePos));
        } else if (this.sk.gui.timelinePanel.aboveTimeline(this.sk.mouseX, this.sk.mouseY) && this.compareToCurDot(map3DMouse, timePos, curDot)) {
            return this.createDot(xPos, yPos, zPos, map3DMouse, Math.abs(map3DMouse - timePos));
        }
        return null;
    }

    compareToCurDot(value1, value2, curDot) {
        let spacing;
        if (curDot === null) spacing = this.sk.width; // if dot has not been set yet, compare to this width
        else spacing = curDot.lengthToCompare;
        return value1 >= value2 - spacing && value1 <= value2 + spacing;
    }

    createDot(xPos, yPos, zPos, timePos, lengthToCompare) {
        return {
            xPos,
            yPos,
            zPos,
            timePos,
            lengthToCompare // used to compare data points to find closest dot value
        }
    }
}