class ParseCodes {

    constructor(sketch, testData) {
        this.sk = sketch;
        this.testData = testData;
        this.parsedFileArray = []; // each index holds a CodeTable object that represents results.data array, character name and counter number
    }

    /**
     * Organizes updating codeFileData if parsed results from PapaParse passes additional tests
     * NOTE: fileNum and fileListLength are used to clear current data and reprocess files
     * @param  {PapaParse results Array} results
     * @param  {File} file
     * @param  {Integer} fileNum
     * @param  {Integer} fileListLength
     */
    processFile(results, file) {
        const codeName = this.testData.cleanFileName(file.name);
        this.parsedFileArray.push(this.createCodeTable(results.data, codeName));
        this.sk.core.updateCodes(codeName); // 2nd parameter is test for if it is last file
    }

    createCodeTable(resultsDataArray, codeName) {
        return {
            parsedCodeArray: resultsDataArray,
            firstCharOfFileName: codeName,
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
        let codesToAdd = [];
        let color = this.sk.COLORGRAY;
        for (let i = 0; i < this.parsedFileArray.length; i++) {
            if (this.timeIsBetweenCurRow(curTime, this.parsedFileArray[i])) {
                codesToAdd.push(true);
                color = this.getCodeColor(color, i);
            } else {
                if (this.parsedFileArray[i].counter < this.parsedFileArray[i].parsedCodeArray.length - 1 && this.timeIsBetweenNextRow(curTime, this.parsedFileArray[i])) {
                    codesToAdd.push(true);
                    color = this.getCodeColor(color, i);
                    this.parsedFileArray[i].counter++;
                } else codesToAdd.push(false);
            }
        }
        return {
            array: codesToAdd,
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
        return results[row][this.testData.headersCodes[0]];
    }

    getEndTime(results, row) {
        return results[row][this.testData.headersCodes[1]];
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