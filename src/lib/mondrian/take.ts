export interface Timed {
  time: number | null
}

const timeOf = (p: Timed) => p.time ?? 0

/**
 * One recording pass over a person's time-sorted trail. The take's points replace
 * whatever the trail held between its first and latest time; the rest is kept.
 */
export class Take<P extends Timed> {
  readonly points: P[] = []
  private readonly before: P[]
  private readonly after: P[]
  /** after[cut..] is later than the take's latest point. */
  private cut = 0

  constructor(
    base: readonly P[],
    readonly startTime: number
  ) {
    const split = base.findIndex((p) => timeOf(p) >= startTime)
    this.before = split === -1 ? [...base] : base.slice(0, split)
    this.after = split === -1 ? [] : base.slice(split)
  }

  get endTime(): number {
    const last = this.points[this.points.length - 1]
    return last ? timeOf(last) : this.startTime
  }

  /** Appends a point; rejects one that would go back in time. */
  add(point: P): boolean {
    const time = timeOf(point)
    if (time < this.endTime) return false
    this.points.push(point)
    while (this.cut < this.after.length && timeOf(this.after[this.cut]) <= time) this.cut++
    return true
  }

  /** The trail with this take applied. */
  trail(): P[] {
    if (this.points.length === 0) return [...this.before, ...this.after]
    return [...this.before, ...this.points, ...this.after.slice(this.cut)]
  }

  /** Base points this take has replaced so far. */
  get replaced(): number {
    return this.cut
  }
}
