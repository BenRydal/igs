/**
 * This class holds different utility and helper methods used in draw movement and conversation classes
 * It centralizes decisions about what points to show and not show and is coupled with the sketchController/gui classes
 */

import TimelineStore from '../../stores/timelineStore';
import CodeStore from '../../stores/codeStore';
import ConfigStore from '../../stores/configStore';

import { get } from 'svelte/store';

let timeline;

TimelineStore.subscribe((data) => {
	timeline = data;
});

let isPathColorMode, isAlignTalk;

ConfigStore.subscribe((data) => {
	isPathColorMode = data.isPathColorMode;
	isAlignTalk = data.isAlignTalk;
});

export class DrawUtils {
	constructor(sketch) {
		this.sk = sketch;
	}

	setCodeColor(searchCodes) {
		const entries = get(CodeStore);
		let matchedEntries = entries.filter((e) => searchCodes.includes(e.code));

		if (matchedEntries.length === 1) {
			return matchedEntries[0].color;
		} else if (matchedEntries.length > 1) {
			// TODO: If we find a new way to manage multiple codes, this is where
			// that change would be. Currently default multiple codes to black.
			return '#000000';
		} else {
			//console.log('No matching codes found');
			return '#808080'; // Default color if no codes match
		}
	}

	isShowingInCodeList(codesArray) {
		if (codesArray.length === 0) return true;

		const entries = get(CodeStore);
		// Retrieve the array of CodeEntry objects
		return entries.some((entry) => codesArray.includes(entry.code) && entry.enabled);
		// Check if any entry code is in codesArray and is enabled }
	}

	isVisible(point, curPos, isStopped) {
		return this.isShowingInGUI(curPos.timelineXPos) && this.selectMode(curPos, isStopped) && this.isShowingInCodeList(point.codes);
	}

	isShowingInGUI(pixelTime) {
		return timeline.overAxis(pixelTime) && this.isShowingInAnimation(pixelTime);
	}

	// TODO: Revisit to determine best approach here--could just return true if you want to show all data while animating
	isShowingInAnimation(value) {
		if (this.sk.sketchController.getIsAnimate()) return timeline.mapPixelTimeToTotalTime(value) < timeline.getCurrTime();
		else return true;
	}

	selectMode(curPos, isStopped) {
		const config = get(ConfigStore);
		if (config.circleToggle) {
			if (this.sk.handle3D.getIs3DModeOrTransitioning()) return true;
			else
				return (
					this.sk.gui.fpContainer.overCursor(curPos.floorPlanXPos, curPos.floorPlanYPos, curPos.selTimelineXPos) &&
					this.sk.gui.highlight.overHighlightArray(curPos.floorPlanXPos, curPos.floorPlanYPos, curPos.selTimelineXPos)
				);
		} else if (config.sliceToggle) {
			if (this.sk.handle3D.getIs3DModeOrTransitioning()) return true;
			else
				return (
					this.sk.gui.fpContainer.overSlicer(curPos.floorPlanXPos, curPos.selTimelineXPos) &&
					this.sk.gui.highlight.overHighlightArray(curPos.floorPlanXPos, curPos.floorPlanYPos, curPos.selTimelineXPos)
				);
		} else if (config.movementToggle) {
			return !isStopped && this.sk.gui.highlight.overHighlightArray(curPos.floorPlanXPos, curPos.floorPlanYPos, curPos.selTimelineXPos);
		} else if (config.stopsToggle) {
			return isStopped && this.sk.gui.highlight.overHighlightArray(curPos.floorPlanXPos, curPos.floorPlanYPos, curPos.selTimelineXPos);
		} else if (config.highlightToggle) {
			return this.sk.gui.highlight.overHighlightArray(curPos.floorPlanXPos, curPos.floorPlanYPos, curPos.timelineXPos);
		}

		// If nothing is selected we just return true
		return true;
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
		const timelineXPos = timeline.mapTotalTimeToPixelTime(time);
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

	getScaledConversationPos(point) {
		const pos = this.getSharedPosValues(point, point.time);
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
		if (isAlignTalk) {
			if (this.sk.handle3D.getIs3DMode()) return this.sk.gui.fpContainer.getContainer().height;
			else return 0;
		} else if (this.sk.handle3D.getIs3DMode()) {
			return floorPlanYPos;
		} else return floorPlanYPos - rectLength;
	}
}
