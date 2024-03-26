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

	updateIsAnimating() {
		this.isAnimating = !this.isAnimating;
	}
}
