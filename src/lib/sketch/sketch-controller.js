/*
This class holds variables that control program flow and are dynamically updated by user
It also holds various mapping methods that map data values from different classes across the program
*/

import TimelineStore from '../../stores/timelineStore';

let timeLine;

TimelineStore.subscribe((data) => {
	timeLine = data;
});

export class SketchController {
	constructor(sketch) {
		this.sk = sketch;
		this.isAlignTalk = false;
		this.isAllTalk = true;
		this.isPathColorMode = true;
		this.curSelectTab = 0; // 5 options: None, Region, Slice, Moving, Stopped
		this.wordToSearch = ''; // String value to dynamically search words in conversation
	}

	updateAnimation() {
		if (timeLine.getCurrTime() < timeLine.getEndTime()) this.continueAnimation();
		else this.endAnimation();
	}

	continueAnimation() {
		let timeToSet = 0;
		const animationRate = 0.05; // TODO: this would get a value from the animation slider in the interface
		if (this.sk.videoController.isLoadedAndIsPlaying()) timeToSet = this.sk.videoController.getVideoPlayerCurTime();
		else timeToSet = timeLine.getCurrTime() + animationRate;
		TimelineStore.update((timeline) => {
			timeLine.setCurrTime(timeToSet);
			return timeline;
		});
	}

	endAnimation() {
		TimelineStore.update((timeline) => {
			timeline.setIsAnimating(false);
			return timeline;
		});
	}

	mapPixelTimeToTotalTime(value) {
		return this.sk.map(value, this.getTimelineStartXPos(), this.getTimelineEndXPos(), 0, timeLine.getEndTime());
	}

	mapPixelTimeToSelectTime(value) {
		return this.sk.map(
			value,
			this.getTimelineStartXPos(),
			this.getTimelineEndXPos(),
			this.getTimelineLeftMarkerXPos(),
			this.getTimelineRightMarkerXPos()
		);
	}

	mapToSelectTimeThenPixelTime(value) {
		return this.mapSelectTimeToPixelTime(this.mapPixelTimeToSelectTime(value));
	}

	mapSelectTimeToPixelTime(value) {
		if (this.sk.handle3D.getIs3DMode())
			return this.sk.map(value, this.getTimelineLeftMarkerXPos(), this.getTimelineRightMarkerXPos(), this.sk.height / 10, this.sk.height / 1.6);
		else return this.mapSelectTimeToPixelTime2D(value);
	}

	mapSelectTimeToPixelTime2D(value) {
		return this.sk.map(
			value,
			this.getTimelineLeftMarkerXPos(),
			this.getTimelineRightMarkerXPos(),
			this.getTimelineStartXPos(),
			this.getTimelineEndXPos()
		);
	}

	// maps value from time in seconds from data to time in pixels on timeline
	mapTotalTimeToPixelTime(value) {
		return this.sk.map(value, 0, timeLine.getEndTime(), this.getTimelineStartXPos(), this.getTimelineEndXPos());
	}

	getIsAnimate() {
		return timeLine.getIsAnimating();
	}

	setIsAllTalk(value) {
		this.isAllTalk = value;
	}

	getIsAllTalk() {
		return this.isAllTalk;
	}

	toggleIsAlignTalk() {
		this.isAlignTalk = !this.isAlignTalk;
	}

	getIsAlignTalk() {
		return this.isAlignTalk;
	}

	toggleIsAllTalk() {
		this.isAllTalk = !this.isAllTalk;
	}

	getIsPathColorMode() {
		return this.isPathColorMode;
	}

	toggleIsPathColorMode() {
		this.isPathColorMode = !this.isPathColorMode;
	}

	setIsPathColorMode(value) {
		this.isPathColorMode = value;
	}

	getCurSelectTab() {
		return this.curSelectTab;
	}

	setCurSelectTab(value) {
		this.curSelectTab = value;
	}

	setWordToSearch(value) {
		this.wordToSearch = value;
	}

	getWordToSearch() {
		return this.wordToSearch;
	}

	/**
	 * Returns pixel width for drawing conversation rectangles based on curTotalTime of data, user timeline selection, and maxRectWidth
	 * NOTE: curScaledRectWidth parameters 0-3600 scale pixels to 1 hour which works well and the map method maps to the inverse of 1 and maxRectWidth to properly adjust scaling/thickness of rects when user interacts with timeline
	 */
	getCurConversationRectWidth() {
		const maxRectWidth = 10;
		const curScaledRectWidth = this.sk.map(timeLine.getEndTime(), 0, 3600, maxRectWidth, 1, true);
		const timelineLength = this.getTimelineRightMarkerXPos() - this.getTimelineLeftMarkerXPos();
		return this.sk.map(timelineLength, 0, timelineLength, maxRectWidth, curScaledRectWidth);
	}

	getTimelineStartXPos() {
		return timeLine.getLeftX();
	}

	getTimelineEndXPos() {
		return timeLine.getRightX();
	}

	getTimelineCurrTime() {
		return timeLine.getCurrTime();
	}

	getTimelineLeftMarkerXPos() {
		return this.sk.sketchController.mapTotalTimeToPixelTime(timeLine.getLeftMarker());
	}

	getTimelineRightMarkerXPos() {
		return this.sk.sketchController.mapTotalTimeToPixelTime(timeLine.getRightMarker());
	}

	overAxis(pixelValue) {
		return pixelValue >= this.getTimelineLeftMarkerXPos() && pixelValue <= this.getTimelineRightMarkerXPos();
	}

	overTimeline() {
		// TODO: update this for new timeline x/y positions
		const pixelValue = this.sk.mouseX;
		return pixelValue >= this.getTimelineLeftMarkerXPos() && pixelValue <= this.getTimelineRightMarkerXPos();
		// return this.sk.overRect(this.start, this.top, this.length, this.thickness);
	}
}
