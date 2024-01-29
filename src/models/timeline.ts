export class Timeline {
  leftMarker: number;
  rightMarker: number;
  startTime: number;
  endTime: number;
  currTime: number;

	constructor(
		leftMarker: number = 0,
    rightMarker: number = 0,
    startTime: number = 0,
    endTime: number = 0,
    currTime: number = 0
	) {
		this.leftMarker = leftMarker;
    this.rightMarker = rightMarker;
    this.startTime = startTime;
    this.endTime = endTime;
    this.currTime = currTime;
	}
}
