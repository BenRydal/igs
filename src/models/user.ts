import type { DataPoint } from './dataPoint';

export class User {
	enabled: boolean; // Whether the user is enabled
	name: string; // Name of the user
	color: string; // Color of the user's trail
	conversation_enabled: boolean; // Whether the user's conversation

	// dataTrail: Map<number, DataPoint>; // Data trail of the user
	dataTrail: DataPoint[]; // Data trail of the user

	constructor(dataTrail: DataPoint[], color: string, enabled = true, name = '', conversation_enabled = true) {
		this.enabled = enabled;
		this.conversation_enabled = enabled;
		this.name = name;
		this.color = color;
		this.dataTrail = dataTrail;
	}
}
