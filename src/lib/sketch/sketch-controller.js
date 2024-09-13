/*
This class holds variables that control program flow and are dynamically updated by user
It also holds various mapping methods that map data values from different classes across the program
*/

import ConfigStore from '../../stores/configStore';
import TimelineStore from '../../stores/timelineStore';

let timeline;
let isPathColorMode;
let curSelectTab;

TimelineStore.subscribe((data) => {
	timeline = data;
});

ConfigStore.subscribe((data) => {
	isPathColorMode = data.isPathColorMode;
	curSelectTab = data.curSelectTab;
});

export class SketchController {
	constructor(sketch) {
		this.sk = sketch;
		this.isAlignTalk = false;
		this.isAllTalk = true;
		this.wordToSearch = ''; // String value to dynamically search words in conversation
	}

	updateAnimation() {
		if (timeline.getCurrTime() < timeline.getEndTime()) this.continueAnimation();
		else this.endAnimation();
	}

	continueAnimation() {
		let timeToSet = 0;
		const animationRate = 0.05; // TODO: this would get a value from the animation slider in the interface
		if (this.sk.videoController.isLoadedAndIsPlaying()) timeToSet = this.sk.videoController.getVideoPlayerCurTime();
		else timeToSet = timeline.getCurrTime() + animationRate;
		TimelineStore.update((timeline) => {
			timeline.setCurrTime(timeToSet);
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
		return this.sk.map(value, timeline.getLeftX(), timeline.getRightX(), 0, timeline.getEndTime());
	}

	mapPixelTimeToSelectTime(value) {
		return this.sk.map(value, timeline.getLeftX(), timeline.getRightX(), this.getTimelineLeftMarkerXPos(), this.getTimelineRightMarkerXPos());
	}

	mapToSelectTimeThenPixelTime(value) {
		return this.mapSelectTimeToPixelTime(this.mapPixelTimeToSelectTime(value));
	}

	mapSelectTimeToPixelTime(value) {
		const spaceTimeCubeBottom = this.sk.height / 10;
		const spaceTimeCubeTop = this.sk.height / 1.6;
		if (this.sk.handle3D.getIs3DMode())
			return this.sk.map(value, this.getTimelineLeftMarkerXPos(), this.getTimelineRightMarkerXPos(), spaceTimeCubeBottom, spaceTimeCubeTop);
		else return this.mapSelectTimeToPixelTime2D(value);
	}

	mapSelectTimeToPixelTime2D(value) {
		return this.sk.map(value, this.getTimelineLeftMarkerXPos(), this.getTimelineRightMarkerXPos(), timeline.getLeftX(), timeline.getRightX());
	}

	// maps value from time in seconds from data to time in pixels on timeline
	mapTotalTimeToPixelTime(value) {
		return this.sk.map(value, 0, timeline.getEndTime(), timeline.getLeftX(), timeline.getRightX());
	}

	getIsAnimate() {
		return timeline.getIsAnimating();
	}

	getIsAllTalk() {
		return this.isAllTalk;
	}

	getIsAlignTalk() {
		return this.isAlignTalk;
	}

	// TODO: This logic is flipped due to some interaction
	// with the ConfigStore value.
	getIsPathColorMode() {
		return !isPathColorMode;
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
		const curScaledRectWidth = this.sk.map(timeline.getEndTime(), 0, 3600, maxRectWidth, 1, true);
		const timelineLength = this.getTimelineRightMarkerXPos() - this.getTimelineLeftMarkerXPos();
		return this.sk.map(timelineLength, 0, timelineLength, maxRectWidth, curScaledRectWidth);
	}

	getTimelineLeftMarkerXPos() {
		return this.mapTotalTimeToPixelTime(timeline.getLeftMarker());
	}

	getTimelineRightMarkerXPos() {
		return this.mapTotalTimeToPixelTime(timeline.getRightMarker());
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
