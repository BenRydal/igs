class ParseCodes {

    constructor(sketch, testData) {
        this.sk = sketch;
        this.testData = testData; // holds various data tests for parsing and processing
        this.parsedCodeFileData = []; // each index of array holds a CodeTable object that represents results.data array, character name and counter number
    }

    /**
     * NOTE: This method is necessary to bind the correct "this" context to callback function
     * @param  {CSV File[]} fileList
     */
    prepFiles(fileList) {
        this.parseFiles(fileList, this.processFile.bind(this));
    }

    /**
     * @param  {.CSV File[]} fileList
     */
    parseFiles(fileList, callback) {
        for (let fileNum = 0; fileNum < fileList.length; fileNum++) {
            Papa.parse(fileList[fileNum], {
                complete: (results, file) => callback(results, file, fileNum, fileList.length),
                error: (error, file) => {
                    alert("Parsing error with your code file. Please make sure your file is formatted correctly as a .CSV");
                    console.log(error, file);
                },
                header: true,
                dynamicTyping: true,
            });
        }
    }

    /**
     * Organizes updating codeFileData if parsed results from PapaParse passes additional tests
     * NOTE: fileNum and fileListLength are used to clear current data and reprocess files
     * @param  {PapaParse results Array} results
     * @param  {File} file
     * @param  {Integer} fileNum
     * @param  {Integer} fileListLength
     */
    processFile(results, file, fileNum, fileListLength) {
        console.log("Parsing complete:", results, file);
        if (this.testData.parsedResults(results, this.testData.headersCodes, this.testData.codeRowForType)) {
            if (fileNum === 0) this.clear(); // clear existing code data when processing first first file
            const codeName = this.testData.cleanFileName(file.name);
            this.parsedCodeFileData.push(createCodeTable(results.data, codeName));
            this.sk.core.updateCodes(results.data, codeName);
            if (fileNum === fileListLength - 1) { // reprocess movement and reset all counters after processing last file
                this.sk.core.parseMovement.reProcessAllPointArrays(); // call after sorting data in updateCodes
                this.resetCounters();
            }
        } else alert("Error loading code file. Please make sure your file is a .CSV file formatted with column headers: " + this.testData.headersCodes.toString());
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
        for (let codeTable of this.parsedCodeFileData) {
            if (this.timeIsBetweenCurRow(curTime, codeTable)) codesToAdd.push(true);
            else {
                if (codeTable.counter < codeTable.parsedCodeArray.length - 1 && this.timeIsBetweenNextRow(curTime, codeTable)) {
                    codesToAdd.push(true);
                    codeTable.counter++;
                } else codesToAdd.push(false);
            }
        }
        return codesToAdd;
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

    createCodeTable(resultsDataArray, codeName) {
        return {
            parsedCodeArray: resultsDataArray,
            firstCharOfFileName: codeName,
            counter: 0
        }
    }

    clear() {
        this.parsedCodeFileData = [];
        this.sk.core.clearCodes();
    }

    resetCounters() {
        for (const codeTable of this.parsedCodeFileData) {
            codeTable.counter = 0;
        }
    }
}