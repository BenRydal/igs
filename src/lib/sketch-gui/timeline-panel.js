export class TimelinePanel {
	constructor(sketch) {
		this.sk = sketch;
		// these are the x pixel positions of the start and end of the timeline where data is displayed
		this.start = this.sk.width * 0.5;
		this.end = this.sk.width * 0.975;

		// these are the x pixel positions of the user selected segments of the timeline that affect scaling of data
		this.selectStart = this.start;
		this.selectEnd = this.end;

		// these vars just draw the visual p5 timeline and use to test
		this.height = this.sk.height * 0.88;
		this.thickness = this.sk.height / 13;
		this.top = this.height - this.thickness / 2;
		this.bottom = this.height + this.thickness / 2;
		this.length = this.end - this.start;
	}

	// TODO: this method may be useful in future to calculate and display minutes/seconds
	getMinutesAndSeconds(timeInSeconds) {
		const minutes = Math.floor(timeInSeconds / 60);
		const seconds = Math.floor(timeInSeconds - minutes * 60);
		return minutes + ' minutes  ' + seconds + ' seconds';
	}

	setSlicerStroke() {
		this.sk.fill(0);
		this.sk.stroke(0);
		this.sk.strokeWeight(2);
	}

	drawLongSlicer() {
		this.setSlicerStroke();
		this.sk.line(this.sk.mouseX, 0, this.sk.mouseX, this.height);
	}

	drawShortSlicer() {
		this.setSlicerStroke();
		this.sk.line(this.sk.mouseX, this.top, this.sk.mouseX, this.bottom);
	}

	draw3DSlicerRect(container, zPos) {
		this.sk.fill(255, 50);
		this.sk.stroke(0);
		this.sk.strokeWeight(1);
		this.sk.quad(
			0,
			0,
			zPos,
			container.width,
			0,
			zPos,
			container.width,
			container.height,
			zPos,
			0,
			container.height,
			zPos
		);
	}

	overAxis(pixelValue) {
		return pixelValue >= this.selectStart && pixelValue <= this.selectEnd;
	}

	overTimeline() {
		return this.sk.overRect(this.start, this.top, this.length, this.thickness);
	}

	getTop() {
		return this.top;
	}

	getStart() {
		return this.start;
	}

	getEnd() {
		return this.end;
	}

	getSelectStart() {
		return this.selectStart;
	}

	getSelectEnd() {
		return this.selectEnd;
	}

	getLength() {
		return this.length;
	}
}
