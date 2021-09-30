class TestPoint {

    constructor(sketch) {
        this.sk = sketch;
    }

    isShowing(curPoint) {
        return this.sk.gui.timelinePanel.overAxis(curPoint.timelineXPos) && this.isShowingInAnimation(curPoint.timelineXPos);
    }

    isShowingInAnimation(value) {
        if (this.sk.sketchController.mode.isAnimate) return this.sk.sketchController.animationCounter > this.sk.sketchController.mapPixelTimeToTotalTime(value);
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
}