export class DataPoint {
	time: number | null;
	speech: string;
	x: number | null;
	y: number | null;
	isStopped: boolean;
	codes: any;
	weight: number;

	constructor(speech: string, time = null, x = null, y = null, isStopped: boolean) {
		this.speech = speech;
		this.time = time;
		this.x = x;
		this.y = y;
		this.isStopped = isStopped;
		this.codes = {
			hasCodeArray: [],
			color: 'blue'
		};
		this.weight = 1; // TODO: do we need this, aren't line weights set in draw methods?
	}
}
