export class DataPoint {
	time: number | null;
	speech: string;
	x: number | null;
	y: number | null;
	isStopped: boolean;
	stopLength: number;
	codes: any;
	weight: number;

	constructor(speech: string, time = null, x = null, y = null, isStopped: boolean) {
		this.speech = speech;
		this.time = time;
		this.x = x;
		this.y = y;
		this.isStopped = isStopped;
		this.stopLength = 0; // TODO: initialize to 0, could pass value as well so just check this is best way to do it
		this.codes = {
			hasCodeArray: [],
			color: 'blue'
		};
		this.weight = 1; // TODO: do we need this, aren't line weights set in draw methods?
	}
}
