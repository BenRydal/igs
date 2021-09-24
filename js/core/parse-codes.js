// 1) test if Code file has correct start and end headers and at least 1 row of number values 
// AND movement data has been loaded
// 2) add first letter/s of filename to global codeArray
// 3) reprocess convo/movement arrays OR have new method to add code values to each array
// NOTE: each point in each array has a codeArray that corresponds to global codeArray
// 4) display codes in GUI
// 5) If global codeArray[index] is true, then show the point if point codeArray[index] is 1

class ParseCodes {

    constructor(sketch, testData) {
        this.sk = sketch;
        this.testData = testData; // holds various data tests for parsing and processing
        this.parsedCodeFileData = []; // array of codeTable objects
    }

    /**
     * Prepare for parsing. Important for binding this to callback
     * @param  {CSV File[]} fileList
     */
    prepFiles(fileList) {
        this.parseFiles(fileList, this.processFiles.bind(this));
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

    processFiles(results, file, fileNum, fileListLength) {
        console.log("Parsing complete:", results, file);
        if (this.testData.testParsedMovementResults(results)) {
            if (fileNum === 0) this.clear(); // clear existing movement data for first new file only
            const pathName = this.testData.cleanPathName(file.name);
            this.updateParsedMovementFileData(results.data, pathName, fileNum, fileListLength);
        } else alert("Error loading movement file. Please make sure your file is a .CSV file formatted with column headers: " + this.headersMovement.toString());
    }

    // TODO: maybe this is better for movement to!!?
    updateParsedCodeFileData(resultsArray, codeName, fileNum, fileListLength) {
        this.parsedMovementFileData.push({
            results: resultsArray, // results.data
            name: codeName, // first 2 letters of filename
            counter: 0 // current counter being processed
        });
        if (fileNum === fileListLength) this.updatePointArrays(results.data, pathName);
    }

    // MUST BE SORTED before processing!!!
    addCodeArray(curTime) {
        const codesToAdd = [];
        for (const codeTable of parsedCodeFileData) {
            if (this.timeIsBetweenCurRow(curTime, codeTable)) codesToAdd.push(true);
            else {
                if (codeTable.counter < codeTable.results.length && this.timeIsBetweenNextRow(curTime, codeTable)) {
                    codesToAdd.push(true);
                    codeTable.counter++;
                } else codesToAdd.push(false);
            }
        }
        return codesToAdd;
    }

    timeIsBetweenCurRow(curTime, codeTable) {
        return between(curTime, getStartTime(codeTable.results, codeTable.counter), getEndTime(codeTable.results, codeTable.counter))
    }

    timeIsBetweenNextRow(curTime, codeTable) {
        return between(curTime, getStartTime(codeTable.results, codeTable.counter + 1), getEndTime(codeTable.results, codeTable.counter + 1))
    }

    getStartTime(results, row) {
        return results[row]["start"];
    }

    getEndTime(results, row) {
        return results[row]["end"];
    }

    between(x, min, max) {
        return x >= min && x <= max;
    }

    resetCounters() {
        for (const codeTable of parsedCodeFileData) {
            codeTable.counter = 0;
        }
    }
}