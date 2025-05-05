export class DataPoint {
    time: number | null;
    speech: string;
    x: number | null;
    y: number | null;
    stopLength: number;
    codes: string[];

    constructor(speech: string, time = null, x = null, y = null) {
        this.speech = speech;
        this.time = time;
        this.x = x;
        this.y = y;
        this.stopLength = 0;
        this.codes = [];
    }

    clone(): DataPoint {
        const clone = new DataPoint(this.speech, this.time, this.x, this.y);
        clone.stopLength = this.stopLength;
        clone.codes = [...this.codes];
        return clone;
    }
}