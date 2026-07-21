export class DataPoint {
  time: number | null
  speech: string
  x: number | null
  y: number | null
  stopLength: number
  codes: string[]

  constructor(
    speech: string,
    time: number | null = null,
    x: number | null = null,
    y: number | null = null
  ) {
    this.speech = speech
    this.time = time
    this.x = x
    this.y = y
    this.stopLength = 0
    this.codes = []
  }
}
