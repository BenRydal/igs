export class DataPoint {
	time: number | null;
	speech: string;
	x: number | null;
	y: number | null;
	stopLength: number;
	codes: string[];

	constructor(speech: string, time = null, x = null, y = null) {
		this.speech = speech;
		this.time = time;
		this.x = x;
		this.y = y;
		this.stopLength = 0; // TODO: initialize to 0, could pass value as well so just check this is best way to do it
		this.codes = [];
	}
}
