interface TimelineData {
	leftMarker?: number;
	rightMarker?: number;
	startTime?: number;
	endTime?: number;
	currTime?: number;
	leftX?: number;
	rightX?: number;
	isAnimating?: boolean;
}

export class Timeline {
	private leftMarker: number;
	private rightMarker: number;
	private startTime: number;
	private endTime: number;
	private currTime: number;
	private leftX: number;
	private rightX: number;
	private isAnimating: boolean;

	constructor(
		leftMarker: number = 0,
		rightMarker: number = 0,
		startTime: number = 0,
		endTime: number = 0,
		currTime: number = 0,
		leftX: number = 0,
		rightX: number = 0,
		isAnimating: boolean = false
	) {
		this.leftMarker = leftMarker;
		this.rightMarker = rightMarker;
		this.startTime = startTime;
		this.endTime = endTime;
		this.currTime = currTime;
		this.leftX = leftX;
		this.rightX = rightX;
		this.isAnimating = isAnimating;
	}

	updateTimeline({ leftMarker, rightMarker, startTime, endTime, currTime }: TimelineData) {
		this.leftMarker = leftMarker ?? this.leftMarker;
		this.rightMarker = rightMarker ?? this.rightMarker;
		this.startTime = startTime ?? this.startTime;
		this.endTime = endTime ?? this.endTime;
		this.currTime = currTime ?? this.currTime;
	}

	updateXPositions({ leftX, rightX }: { leftX?: number; rightX?: number }) {
		this.leftX = leftX ?? this.leftX;
		this.rightX = rightX ?? this.rightX;
	}

	getLeftX() {
		return this.leftX;
	}

	getRightX() {
		return this.rightX;
	}

	getLeftMarker() {
		return this.leftMarker;
	}

	setLeftMarker(leftMarker: number) {
		this.leftMarker = leftMarker;
	}

	getRightMarker() {
		return this.rightMarker;
	}

	setRightMarker(rightMarker: number) {
		this.rightMarker = rightMarker;
	}

	getStartTime() {
		return this.startTime;
	}

	setStartTime(startTime: number) {
		this.startTime = startTime;
	}

	getEndTime() {
		return this.endTime;
	}

	setEndTime(endTime: number) {
		this.endTime = endTime;
	}

	getCurrTime() {
		return this.currTime;
	}

	setCurrTime(currTime: number) {
		this.currTime = currTime;
	}

	getIsAnimating() {
		return this.isAnimating;
	}

	setIsAnimating(isAnimating: boolean) {
		this.isAnimating = isAnimating;
	}

	mapPixelTimeToTotalTime(value) {
		return this.map(value, this.getLeftX(), this.getRightX(), 0, this.getEndTime());
	}

	mapPixelTimeToSelectTime(value) {
		return this.map(value, this.getLeftX(), this.getRightX(), this.getTimelineLeftMarkerXPos(), this.getTimelineRightMarkerXPos());
	}

	mapSelectTimeToPixelTime2D(value) {
		return this.map(value, this.getTimelineLeftMarkerXPos(), this.getTimelineRightMarkerXPos(), this.getLeftX(), this.getRightX());
	}

	// maps value from time in seconds from data to time in pixels on timeline
	mapTotalTimeToPixelTime(value) {
		return this.map(value, 0, this.getEndTime(), this.getLeftX(), this.getRightX());
	}

	getTimelineLeftMarkerXPos() {
		return this.mapTotalTimeToPixelTime(this.getLeftMarker());
	}
	getTimelineRightMarkerXPos() {
		return this.mapTotalTimeToPixelTime(this.getRightMarker());
	}

	overAxis(pixelValue) {
		return pixelValue >= this.getTimelineLeftMarkerXPos() && pixelValue <= this.getTimelineRightMarkerXPos();
	}

	overTimeline(pixelValue) {
		// TODO: update this for new timeline x/y positions
		return pixelValue >= this.getTimelineLeftMarkerXPos() && pixelValue <= this.getTimelineRightMarkerXPos();
		// return this.sk.overRect(this.start, this.top, this.length, this.thickness);
	}

	/**
	 * Returns pixel width for drawing conversation rectangles based on curTotalTime of data, user timeline selection, and maxRectWidth
	 * NOTE: curScaledRectWidth parameters 0-3600 scale pixels to 1 hour which works well and the map method maps to the inverse of 1 and maxRectWidth to properly adjust scaling/thickness of rects when user interacts with timeline
	 */
	getCurConversationRectWidth() {
		const maxRectWidth = 10;
		const curScaledRectWidth = this.map(this.getEndTime(), 0, 3600, maxRectWidth, 1, true);
		const timelineLength = this.getTimelineRightMarkerXPos() - this.getTimelineLeftMarkerXPos();
		return this.map(timelineLength, 0, timelineLength, maxRectWidth, curScaledRectWidth);
	}

	// Implementation of Helper function from P5 library to map a value from one range to another
	map(value, start1, stop1, start2, stop2, withinBounds = false) {
		// Perform the mapping
		let newval = ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2;

		// If withinBounds is true, constrain the value within [start2, stop2]
		if (withinBounds) {
			return this.constrain(newval, start2, stop2);
		}

		// Return the mapped value without clamping
		return newval;
	}

	// Helper function to constrain the value within a specific range
	constrain(n, low, high) {
		return Math.max(Math.min(n, high), low);
	}
}
