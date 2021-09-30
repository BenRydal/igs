class TestPoint {

    constructor(sketch) {
        this.sk = sketch;
    }

    isShowing(curPoint) {
        return this.sk.gui.timelinePanel.overAxis(curPoint.timelineXPos) && this.isShowingInAnimation(curPoint.timelineXPos);
    }

    isShowingInAnimation(value) {
        if (this.sk.sketchController.getIsAnimate()) return this.sk.sketchController.animationCounter > this.sk.sketchController.mapPixelTimeToTotalTime(value);
        else return true;
    }

    // Loop through codeList and return false if:
    // for any of codes that are true in codeList a code at curPoint is false 
    passCodeTest(curPoint) {
        if (this.sk.arrayIsLoaded(this.sk.core.codeList)) {
            for (let j = 0; j < this.sk.core.codeList.length; j++) {
                if (this.sk.core.codeList[j].isShowing) {
                    if (curPoint.codeArray[j]) continue;
                    else return false;
                }
            }
        }
        return true;
    }

    /**
     * Returns properly scaled pixel values to GUI from data points
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
        else if (view === this.sk.SPACETIME) {
            if (this.sk.sketchController.handle3D.getIsShowing()) return floorPlanXPos;
            else return selTimelineXPos;
        } else return null;
    }

    getZPos(view, selTimelineXPos) {
        if (view === this.sk.PLAN) return 0;
        else {
            if (this.sk.sketchController.handle3D.getIsShowing()) return selTimelineXPos;
            else return 0;
        }
    }

    /**
     * Holds logic for testing whether to draw stops on the floor plan
     * @param  {Integer} view
     * @param  {MovementPoint} curPoint
     */
    isPlanViewAndStopped(view, curPoint) {
        return (view === this.sk.PLAN && curPoint.isStopped && this.sk.gui.dataPanel.getCurSelectTab() !== 3);
    }
    /**
     * Holds logic for testing current point based on selectMode
     * @param  {ComparePoint} p
     */
    selectModeForFatLine(p) {
        switch (this.sk.gui.dataPanel.getCurSelectTab()) {
            case 1:
                return this.sk.gui.fpContainer.overCursor(p.curPos.floorPlanXPos, p.curPos.floorPlanYPos);
            case 2:
                return this.sk.gui.fpContainer.overSlicer(p.curPos.floorPlanXPos, p.curPos.floorPlanYPos);
            default:
                return p.curPoint.isStopped; // this always returns false for floorplan view
        }
    }

    selectModeForConversation(curPoint, point) {
        switch (this.sk.gui.dataPanel.getCurSelectTab()) {
            case 0:
                return true;
            case 1:
                return this.sk.gui.fpContainer.overCursor(curPoint.floorPlanXPos, curPoint.floorPlanYPos);
            case 2:
                return this.sk.gui.fpContainer.overSlicer(curPoint.floorPlanXPos, curPoint.floorPlanYPos);
            case 3:
                return !point.isStopped;
            case 4:
                return point.isStopped;
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

    getNewDot(curPos, curDot) {
        let newDot = null;
        const [xPos, yPos, zPos, timePos, map3DMouse] = [curPos.floorPlanXPos, curPos.floorPlanYPos, curPos.zPos, curPos.selTimelineXPos, this.sk.sketchController.mapToSelectTimeThenPixelTime(this.sk.mouseX)];
        if (this.sk.sketchController.getIsAnimate()) {
            newDot = this.createDot(xPos, yPos, zPos, timePos, null); // always return true to set last/most recent point as the dot
        } else if (this.sk.sketchController.mode.isVideoPlay) {
            const videoToSelectTime = this.sk.sketchController.mapVideoTimeToSelectedTime();
            if (this.compareToCurDot(videoToSelectTime, timePos, curDot)) newDot = this.createDot(xPos, yPos, zPos, timePos, Math.abs(videoToSelectTime - timePos));
        } else if (this.sk.gui.timelinePanel.aboveTimeline(this.sk.mouseX, this.sk.mouseY) && this.compareToCurDot(map3DMouse, timePos, curDot)) {
            newDot = this.createDot(xPos, yPos, zPos, map3DMouse, Math.abs(map3DMouse - timePos));
        }
        return newDot;
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