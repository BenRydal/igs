import type { DataPoint } from './dataPoint';

export class User {
  enabled: boolean;  // Whether the user is enabled
  name: string;  // Name of the user
  color: string;  // Color of the user's trail

  dataTrail: Map<number, DataPoint>;  // Data trail of the user
  segments: string[];

  constructor(
    enabled: boolean = true,
    name: string = "",
    color: string = getRandomColor(),
    dataTrail: Map<number, DataPoint> = new Map<number, DataPoint>(),
    // user {
    //  name = Announcer
    //  datatrail = {
    //   1, {
    //     speech: "Brings them to within one!",
    //     x = -1
    //     y = -1
    //   }
    // }

    segments: string[] = []
  ) {
    this.enabled = enabled;
    this.name = name;
    this.color = color;

    this.dataTrail = dataTrail;
    this.segments = segments;
  }
};

function getRandomColor(): string {
  const colors = [
    '#D8A7B1', '#B39AB1', '#9AA7B1', '#A7B1B1', '#A7B19A', '#B1A798', '#B1A7B0', '#A798A7',
    '#D9C8B3', '#D9C8C4', '#B3C4D9', '#B3D9C8', '#C8D9B3', '#C4D9D2', '#D9C4D2', '#D2D9C4'
  ];

  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
}