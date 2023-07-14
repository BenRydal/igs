export class DataPoint {
  speech: string;
  x: number;
  y: number;

  constructor(
    speech: string = "",
    x: number = -1,
    y: number = -1
  ) {
    this.speech = speech;
    this.x = x;
    this.y = y;
  }
}