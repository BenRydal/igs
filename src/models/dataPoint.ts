export class DataPoint {
	speech: string;
	x: number;
	y: number;
	isStopped: boolean;
	codes: any;

	constructor(speech: string, x: number, y: number) {
		this.speech = speech;
		this.x = x;
		this.y = y;
		this.isStopped = false; // TODO: update with new methods to calculate stops
		this.codes = {
			hasCodeArray: [],
			color: 'blue'
		};
	}
}
