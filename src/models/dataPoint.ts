export class DataPoint {
    time: number | null;
    speech: string;
    x: number | null;
    y: number | null;
    stopLength: number;
    codes: string[];
    interpolated?: boolean;

    constructor(data: {
        speech?: string;
        time?: number | null;
        x?: number | null;
        y?: number | null;
        stopLength?: number;
        codes?: string[];
        interpolated?: boolean;
    } | string, time = null, x = null, y = null) {
        if (typeof data === 'string') {
            // Legacy constructor support
            this.speech = data;
            this.time = time;
            this.x = x;
            this.y = y;
            this.stopLength = 0;
            this.codes = [];
            this.interpolated = false;
        } else {
            this.speech = data.speech || '';
            this.time = data.time !== undefined ? data.time : null;
            this.x = data.x !== undefined ? data.x : null;
            this.y = data.y !== undefined ? data.y : null;
            this.stopLength = data.stopLength || 0;
            this.codes = data.codes || [];
            this.interpolated = data.interpolated || false;
        }
    }

    clone(): DataPoint {
        return new DataPoint({
            speech: this.speech,
            time: this.time,
            x: this.x,
            y: this.y,
            stopLength: this.stopLength,
            codes: [...this.codes],
            interpolated: this.interpolated
        });
    }
}