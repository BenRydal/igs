import type { DataPoint } from './dataPoint';

export class User {
	enabled: boolean; // Whether the user is enabled
	name: string; // Name of the user
	color: string; // Color of the user's trail

	// dataTrail: Map<number, DataPoint>; // Data trail of the user
	dataTrail: DataPoint[]; // Data trail of the user
	segments: string[];

	constructor(
		// dataTrail: Map<number, DataPoint> = new Map<number, DataPoint>(),
		dataTrail: DataPoint[],
		color: string,
		segments: string[] = [],
		enabled = true,
		name = ''
	) {
		this.enabled = enabled;
		this.name = name;
		this.color = color;
		this.dataTrail = dataTrail;
		this.segments = segments;
	}
}
