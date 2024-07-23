/**
 * This class holds different utility and helper methods used in draw movement and conversation classes
 * It centralizes decisions about what points to show and not show and is coupled with the sketchController/gui classes
 */

import TimelineStore from '../../stores/timelineStore';

let timeline;

TimelineStore.subscribe((data) => {
	timeline = data;
});

import { get } from 'svelte/store';
import CodeStore from '../../stores/codeStore';

CodeStore.subscribe((data) => {
	console.log(data);
});

export class DrawUtils {
	constructor(sketch) {
		this.sk = sketch;
	}

	zzzSetCodeColor(searchCodes) {
		const entries = get(CodeStore);
		let matchedEntries = entries.filter((e) => searchCodes.includes(e.code));
		if (matchedEntries.length > 1) {
			// console.log(matchedEntries);
			return '#000000';
		} else if (matchedEntries.length === 1) {
			return matchedEntries[0].color;
		} else {
			console.log('No matching color found');
			return '#111111';
		}
	}

	/**
	 * This method tests if a point is showing for all selected codes from codeList
	 * IMPLEMENTATION: Iterate through codeList and return false if: for any of codes that are true in codeList a code at curPoint is false
	 * @param  {MovementPoint} point
	 */
	isShowingInCodeList(codesArray) {
		//return codesArray.includes('class seatwork') || codesArray.includes('independent seatwork');

		// TODO: update here to select only codes that are enabled
		const entries = get(CodeStore); // This retrieves the array of CodeEntry objects
		const codesToCheck = entries.map((entry) => entry.code); // Extracts the 'code' properties into an array

		return codesToCheck.some((code) => codesArray.includes(code));

		//return true;
	}

	/**
	 * Holds tests for determining if point is visible (e.g., selected, highlighted)
	 */
	isVisible(point, curPos) {
		return this.isShowingInGUI(curPos.timelineXPos) && this.selectMode(curPos, point.isStopped) && this.isShowingInCodeList(point.codes);
	}

	isShowingInGUI(pixelTime) {
		return this.sk.sketchController.overAxis(pixelTime) && this.isShowingInAnimation(pixelTime);
	}

	// TODO: Revisit to determine best approach here--could just return true if you want to show all data while animating
	isShowingInAnimation(value) {
		if (this.sk.sketchController.getIsAnimate()) return this.sk.sketchController.mapPixelTimeToTotalTime(value) < timeline.getCurrTime();
		else return true;
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
				else
					return (
						this.sk.gui.fpContainer.overCursor(curPos.floorPlanXPos, curPos.floorPlanYPos, curPos.selTimelineXPos) &&
						this.sk.gui.highlight.overHighlightArray(curPos.floorPlanXPos, curPos.floorPlanYPos, curPos.selTimelineXPos)
					);
			case 2:
				if (this.sk.handle3D.getIs3DModeOrTransitioning()) return true;
				else
					return (
						this.sk.gui.fpContainer.overSlicer(curPos.floorPlanXPos, curPos.selTimelineXPos) &&
						this.sk.gui.highlight.overHighlightArray(curPos.floorPlanXPos, curPos.floorPlanYPos, curPos.selTimelineXPos)
					);
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
	 * @param  {Integer} time
	 * @param  {Integer} previousTime
	 */
	createComparePoint(view, curIndex, priorIndex, time, previousTime) {
		return {
			cur: this.createAugmentPoint(view, curIndex, time),
			prior: this.createAugmentPoint(view, priorIndex, previousTime)
		};
	}

	createAugmentPoint(view, point, time) {
		return {
			point,
			pos: this.getScaledMovementPos(point, view, time)
		};
	}

	/**
	 * Returns scaled pixel values for a point to graphical display
	 * IMPORTANT: currently view parameter can be either one of 2 constants or "null" for conversation drawing
	 * @param  {Movement Or Conversation Point} point
	 * @param  {Integer} time
	 */
	getSharedPosValues(point, time) {
		const timelineXPos = this.sk.sketchController.mapTotalTimeToPixelTime(time);
		const selTimelineXPos = this.sk.sketchController.mapSelectTimeToPixelTime(timelineXPos);

		const [floorPlanXPos, floorPlanYPos] = this.sk.floorPlan.getScaledXYPos(point.x, point.y, this.sk.gui.fpContainer.getContainer());

		return {
			timelineXPos,
			selTimelineXPos,
			floorPlanXPos,
			floorPlanYPos
		};
	}

	/**
	 * @param  {MovementPoint} point
	 * @param  {Integer} view
	 */
	getScaledMovementPos(point, view, time) {
		const pos = this.getSharedPosValues(point, time);
		return {
			timelineXPos: pos.timelineXPos,
			selTimelineXPos: pos.selTimelineXPos,
			floorPlanXPos: pos.floorPlanXPos,
			floorPlanYPos: pos.floorPlanYPos,
			viewXPos: this.getViewXPos(view, pos.floorPlanXPos, pos.selTimelineXPos),
			zPos: this.getZPos(view, pos.selTimelineXPos)
		};
	}

	getScaledConversationPos(point, time) {
		const pos = this.getSharedPosValues(point, time);
		const rectLength = this.sk.constrain(point.speech.length / 2, 3, 175); // 3 and 175 set min and max pixel dimensions
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
