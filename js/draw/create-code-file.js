// TODO:
// finalize createCodeFile
// move methods to drawUtils
// add html button and listeners
// test if path loaded? and then new CreateCodeFile(this.sk, pathList, codeList);

import { DrawMovement } from './draw-movement.js';
import { DrawUtils } from './draw-utils.js';

export class CreateCodeFile {

    constructor(sketch, pathList, codeList) {
        this.sk = sketch;
        this.pathList = pathList;
        this.drawUtils = new DrawUtils(sketch, codeList);
    }

    createCodeFile() {
        if (this.sk.arrayIsLoaded(this.pathList)) { // move this to button method?
            const drawMovement = new DrawMovement(this.sk, this.drawUtils);
            for (const path of this.pathList) {
                if (path.isShowing) {
                    const [startTimesArray, endTimesArray] = drawMovement.getCodeFileArrays(path);
                    // TODO need to save and write the file for EVERY path--save it with path name?
                    // test if length of startTimes === path length
                    this.sk.saveTable(this.writeTable(startTimesArray, endTimesArray), path.name, "csv");
                }
            }
        }
    }

    // TODO: don't pass view
    // * 
    getCodeFileArrays(view, movementArray) {
        let startTimesArray = [];
        let endTimesArray = [];
        let zzzRecordingCode = false;
        for (let i = 1; i < movementArray.length; i++) { // start at 1 to allow testing of current and prior indices
            const p = this.drawUtils.createComparePoint(view, movementArray[i], movementArray[i - 1]); // a compare point consists of current and prior augmented points
            if (this.drawUtils.isVisible(p.cur.point, p.cur.pos)) {
                if (zzzRecordingCode === false) {
                    zzzRecordingCode = true;
                    startTimesArray.push(p.cur.point.time);
                }
            } else {
                if (zzzRecordingCode === true) {
                    zzzRecordingCode = false;
                    endTimesArray.push(p.prior.point.time);
                }
            }
        }
        // for last point in case still recording?
        // if (zzzRecordingCode === true) endTimesArray.push(p.prior.point.time);
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