/**
 * This class holds methods to create and write code files from displayed data. Methods that 
 * determine what data is displayed/to write should match the logic in other drawing classes
 */
export class CreateCodeFile {

    constructor(sketch, drawUtils) {
        this.sk = sketch;
        this.drawUtils = drawUtils;
    }

    create(path) {
        const [startTimesArray, endTimesArray] = this.getCodeFileArrays(path.movement);
        if (endTimesArray.length) this.sk.saveTable(this.writeTable(startTimesArray, endTimesArray), path.name, "csv");
    }

    /**
     * IMPORTANT: the structure of this method should match how movement paths are drawn setDraw method in DrawMovement class
     * It determines which points are showing and saves start/end times values for those points in arrays
     */
    getCodeFileArrays(movementArray) {
        let startTimesArray = [];
        let endTimesArray = [];
        let isRecordingCode = false;
        for (let i = 1; i < movementArray.length; i++) { // start at 1 to allow testing of current and prior indices
            const p = this.drawUtils.createComparePoint(this.sk.PLAN, movementArray[i], movementArray[i - 1]); // a compare point consists of current and prior augmented points
            if (this.drawUtils.isVisible(p.cur.point, p.cur.pos)) {
                if (isRecordingCode === false) {
                    isRecordingCode = true;
                    startTimesArray.push(p.cur.point.time);
                }
            } else {
                if (isRecordingCode === true) {
                    isRecordingCode = false;
                    endTimesArray.push(p.prior.point.time);
                }
            }
            // For last point if still recording
            if (i === movementArray.length - 1 && isRecordingCode === true) endTimesArray.push(p.cur.point.time);
        }
        return [startTimesArray, endTimesArray];
    }

    writeTable(startTimesArray, endTimesArray) {
        const headers = ["start", "end"];
        let table = new p5.Table();
        table.addColumn(headers[0]);
        table.addColumn(headers[1]);
        for (let i = 0; i < startTimesArray.length; i++) {
            let newRow = table.addRow();
            newRow.setNum(headers[0], startTimesArray[i]);
            newRow.setNum(headers[1], endTimesArray[i]);
        }
        return table;
    }
}