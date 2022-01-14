class ParseCodes {

    constructor(sketch, testData) {
        this.sk = sketch;
        this.testData = testData;
        this.parsedFileArray = []; // holds CodeTable objects that represent results.data array, character name and counter number
    }

    /**
     * Updates parsedFileArray with new codeTable
     * @param  {PapaParse results Array} results
     * @param  {File} file
     */
    processSingleCodeFile(results, file) {
        const codeName = this.testData.cleanCodeFileName(file.name); // remove file extension
        this.parsedFileArray.push(this.createCodeTable(results.data, codeName));
        this.sk.core.updateCodes(codeName);
    }

    /**
     * Handles updating parsedFileArray with for multiCodeFile
     * @param  {PapaParse results Array} results
     */
    processMultiCodeFile(results) {
        this.clear(); // NOTE: clearing all existing code data prevents mixing single and multi code files. You can only have ONE multicode file
        this.updateParsedFileArrayForMultiCodes(results);
        for (const codeTable of this.parsedFileArray) this.sk.core.updateCodes(codeTable.codeName);
    }

    /**
     * For each row, updates either an existing codeTable in parsedFileArray or adds a new codeTable
     * NOTE: First letter of first column used to test if there is existing codeTable object
     * @param  {PapaParse results Array} results
     */
    updateParsedFileArrayForMultiCodes(results) {
        for (const row of results.data) {
            const curCodeName = this.testData.cleanCodeFileName(row[this.testData.headersMultiCodes[0]]);
            let addNewTable = true; // to add new code table if parsedFileArray empty or no name match/existing codeTable NOT updated
            for (const codeTable of this.parsedFileArray) { // test for name match to updated existing codeTable
                if (codeTable.codeName === curCodeName) {
                    codeTable.parsedCodeArray.push(row); // update matching parsedCodeArray with new row object
                    addNewTable = false;
                    break; // existing codeTable updated so no need to process any other code tables
                }
            }
            if (addNewTable) this.parsedFileArray.push(this.createCodeTable([row], curCodeName)); // NOTE: make sure row is added as an array
        }
    }

    createCodeTable(resultsDataArray, codeName) {
        return {
            parsedCodeArray: resultsDataArray,
            codeName: codeName,
            counter: 0
        }
    }

    /** 
     * Invoked when creating point arrays in parseMovement
     * Tests if the current time value is between any start/end code times in all loaded codeTables
     * NOTE: comparing to next row in codeTable and use of codeTable counters tries to do this in a most efficient manner
     * 
     * @param  {Number/Float} curTime
     */
    addCodeArray(curTime) {
        let codeArrayToAdd = [];
        let color = this.sk.COLORGRAY;
        for (let i = 0; i < this.parsedFileArray.length; i++) {
            if (this.timeIsBetweenCurRow(curTime, this.parsedFileArray[i])) {
                codeArrayToAdd.push(true);
                color = this.getCodeColor(color, i);
            } else {
                if (this.parsedFileArray[i].counter < this.parsedFileArray[i].parsedCodeArray.length - 1 && this.timeIsBetweenNextRow(curTime, this.parsedFileArray[i])) {
                    codeArrayToAdd.push(true);
                    color = this.getCodeColor(color, i);
                    this.parsedFileArray[i].counter++;
                } else codeArrayToAdd.push(false);
            }
        }
        return {
            array: codeArrayToAdd,
            color: color
        }
    }

    getCodeColor(color, index) {
        if (color === this.sk.COLORGRAY) return this.sk.core.COLOR_LIST[index % this.sk.core.COLOR_LIST.length];
        else return 0; // if color already assigned, make it black because there are multiple true codes for same curTime
    }
    timeIsBetweenCurRow(curTime, codeTable) {
        return this.between(curTime, this.getStartTime(codeTable.parsedCodeArray, codeTable.counter), this.getEndTime(codeTable.parsedCodeArray, codeTable.counter));
    }

    timeIsBetweenNextRow(curTime, codeTable) {
        return this.between(curTime, this.getStartTime(codeTable.parsedCodeArray, codeTable.counter + 1), this.getEndTime(codeTable.parsedCodeArray, codeTable.counter + 1));
    }

    getStartTime(results, row) {
        return results[row][this.testData.headersSingleCodes[0]];
    }

    getEndTime(results, row) {
        return results[row][this.testData.headersSingleCodes[1]];
    }

    between(x, min, max) {
        return x >= min && x <= max;
    }

    clear() {
        this.parsedFileArray = [];
        this.sk.core.clearCodes();
    }

    resetCounters() {
        for (const codeTable of this.parsedFileArray) {
            codeTable.counter = 0;
        }
    }
}