import type { DataPoint } from './dataPoint';

export class User {
  enabled: boolean;  // Whether the user is enabled
  name: string;  // Name of the user
  color: string;  // Color of the user's trail

  dataTrail: Map<number, DataPoint>;  // Data trail of the user
  segments: string[];

  constructor(
    enabled = true,
    name = "",
    dataTrail: Map<number, DataPoint> = new Map<number, DataPoint>(),
    color = "red",
    segments: string[] = []
  ) {
    this.enabled = enabled;
    this.name = name;
    this.color = color;

    this.dataTrail = dataTrail;
    this.segments = segments;
  }
};