import TimelineStore from '../../stores/timelineStore';

let timeLine;

TimelineStore.subscribe((data) => {
	timeLine = data;
});
export class TimelinePanel {
	constructor(sketch) {
		this.sk = sketch;
		// these are the x pixel positions of the start and end of the timeline where data is displayed
		this.start = timeLine.getLeftX();
		this.end = timeLine.getRightX();

		// these are the x pixel positions of the user selected segments of the timeline that affect scaling of data
		this.selectStart = this.start;
		this.selectEnd = this.end;

		// these vars just draw the visual p5 timeline and use to test
		this.height = this.sk.height * 0.88;
		this.thickness = this.sk.height / 13;
		this.top = this.height - this.thickness / 2;
		this.length = this.end - this.start;
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

	draw3DSlicerRect(container, zPos) {
		this.sk.fill(255, 50);
		this.sk.stroke(0);
		this.sk.strokeWeight(1);
		this.sk.quad(0, 0, zPos, container.width, 0, zPos, container.width, container.height, zPos, 0, container.height, zPos);
	}
}
