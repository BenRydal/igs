export class DataPoint {
	time: number | null;
	speech: string;
	x: number | null;
	y: number | null;
	isStopped: boolean;
	codes: any;
	weight: number;

	constructor(speech: string, time = null, x = null, y = null) {
		this.speech = speech;
		this.time = time;

		this.x = x;
		this.y = y;
		this.isStopped = false; // TODO: update with new methods to calculate stops
		this.codes = {
			hasCodeArray: [],
			color: 'blue'
		};
		this.weight = 1;
	}
}
