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
      color: "blue",
    }
  }
  

  getRandomColor(): string {
    const colors = [
      '#D8A7B1', '#B39AB1', '#9AA7B1', '#A7B1B1', '#A7B19A', '#B1A798', '#B1A7B0', '#A798A7',
      '#D9C8B3', '#D9C8C4', '#B3C4D9', '#B3D9C8', '#C8D9B3', '#C4D9D2', '#D9C4D2', '#D2D9C4'
    ];

    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  }
}