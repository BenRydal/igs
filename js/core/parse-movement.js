class ParseMovement {

    constructor(sketch) {
        this.sk = sketch;
        this.HEADERS = ['time', 'x', 'y'];
        this.parsedMovementFileData = []; // List that holds objects containing a parsed results.data array and character letter indicating path name from Papa Parsed CSV file
    }

    /**
     * Prepare for parsing. Important for binding this to callback
     * @param  {.CSV File[]} fileList
     */
    prepFiles(fileList) {
        this.parseFiles(fileList, this.processFiles.bind(this));
    }

    /**
     * Handles async loading of movement files. NOTE: folder and filename are separated for convenience later in program
     * @param  {String} folder
     * @param  {String} fileNames
     */
    async prepExampleFiles(folder, fileNames) {
        try {
            let fileList = [];
            for (const name of fileNames) {
                const response = await fetch(new Request(folder + name));
                const buffer = await response.arrayBuffer();
                fileList.push(new File([buffer], name, {
                    type: "text/csv",
                }));
            }
            this.parseFiles(fileList, this.processFiles.bind(this)); // parse file after retrieval, maintain correct this context on callback with bind
        } catch (error) {
            alert("Error loading example movement data. Please make sure you have a good internet connection")
            console.log(error);
        }
    }

    /**
     * Parse input files and send to processData method
     * @param  {.CSV File[]} fileList
     */
    parseFiles(fileList, callback) {
        for (let fileNum = 0; fileNum < fileList.length; fileNum++) {
            Papa.parse(fileList[fileNum], {
                complete: (results, file) => callback(results, file, fileNum),
                error: (error, file) => {
                    alert("Parsing error with your movement file. Please make sure your file is formatted correctly as a .CSV");
                    console.log(error, file);
                },
                header: true,
                dynamicTyping: true,
            });
        }
    }

    processFiles(results, file, fileNum) {
        console.log("Parsing complete:", results, file);
        if (this.testParsedResults(results)) {
            if (fileNum === 0) this.clear(); // clear existing movement data for first new file only
            const pathName = this.sk.core.cleanPathName(file.name);
            this.updateParsedMovementFileData(results.data, pathName);
            this.updatePointArrays(results.data, pathName);
        } else alert("Error loading movement file. Please make sure your file is a .CSV file formatted with column headers: " + this.HEADERS.toString());
    }

    updateParsedMovementFileData(resultsArray, pathName) {
        this.parsedMovementFileData.push({
            parsedMovementArray: resultsArray,
            firstCharOfFileName: pathName // get name of path, also used to test if associated speaker in conversation file
        });
    }

    updatePointArrays(resultsArray, pathName) {
        const [movementPointArray, conversationPointArray] = this.createPointArrays(resultsArray, this.sk.core.parseConversation.getParsedConversationArray());
        this.sk.core.updateMovementData(pathName, movementPointArray, conversationPointArray);
    }

    reProcessPointArrays() {
        for (const index of this.parsedMovementFileData) {
            const [movementPointArray, conversationPointArray] = this.createPointArrays(index.parsedMovementArray, this.sk.core.parseConversation.getParsedConversationArray());
            this.sk.core.updatePaths(index.firstCharOfFileName, movementPointArray, conversationPointArray);
        }
    }

    /**
     * Returns clean movement and conversation arrays of MovementPoint and ConversationPoint objects
     * Location data for conversation array is drawn from comparison to movement file/results data
     *  @param  {PapaParse Results []} results
     */
    createPointArrays(parsedMovementArray, parsedConversationArray) {
        let movementPointArray = [];
        let conversationPointArray = [];
        let conversationCounter = 0; // Current row count of conversation file for comparison
        for (let i = 1; i < parsedMovementArray.length; i++) {
            const rows = this.createCompareRow(parsedMovementArray[i], parsedMovementArray[i - 1]); // create object to hold current and prior points as well as pixel positions
            if (this.movementRowForType(rows.curRow) && this.compareCurAndPriorTime(rows)) {
                const m = this.createMovementPoint(rows.curRow, movementPointArray);
                movementPointArray.push(m);
                if (this.testIsLoadedAndCounter(parsedConversationArray, conversationCounter)) {
                    const curConversationRow = parsedConversationArray[conversationCounter];
                    if (this.typeTestAndCompareMovementTime(curConversationRow, m.time)) {
                        conversationPointArray.push(this.createConversationPoint(m, curConversationRow));
                        conversationCounter++;
                    } else if (!this.zzzConversationRowForType(curConversationRow)) conversationCounter++; // make sure to increment counter if bad data to skip row in next iteration of loop
                }
            }
        }
        return [movementPointArray, conversationPointArray];
    }


    /**
     * Test if results array has data, correct file headers, and at least one row of correctly typed data
     * @param  {PapaParse Results []} results
     */
    testParsedResults(results) {
        return results.data.length > 1 && this.sk.testData.includesAllHeaders(results.meta.fields, this.HEADERS) && this.hasOneCleanRow(results.data);
    }

    /**
     * Tests if at least one row of correctly typed data in PapaParse data array
     * Returns true on first row of PapaParse data array that has all correctly typed data for movement headers
     * @param  {PapaParse results.data []} data
     */
    hasOneCleanRow(parsedMovementArray) {
        for (const curRow of parsedMovementArray) {
            if (this.movementRowForType(curRow)) return true;
        }
        return false;
    }

    compareCurAndPriorTime(rows) {
        return Number.parseFloat(rows.curRow[this.HEADERS[0]]).toFixed(1) > Number.parseFloat(rows.priorRow[this.HEADERS[0]]).toFixed(1);
    }

    movementRowForType(curRow) {
        return typeof curRow[this.HEADERS[0]] === 'number' && typeof curRow[this.HEADERS[1]] === 'number' && typeof curRow[this.HEADERS[2]] === 'number';
    }

    testIsLoadedAndCounter(parsedConversationArray, conversationCounter) {
        return this.sk.testData.arrayIsLoaded(parsedConversationArray) && conversationCounter < parsedConversationArray.length;
    }

    typeTestAndCompareMovementTime(curConversationRow, movementPointTime) {
        return this.zzzConversationRowForType(curConversationRow) && movementPointTime >= curConversationRow[this.sk.testData.CSVHEADERS_CONVERSATION[0]];
    }

    // TODO: REMOVE!!!!
    // Tests if current conversation row is less than total rows in table and if time is number and speaker is string and talk turn is not null or undefined
    zzzConversationRowForType(curRow) {
        return typeof curRow[this.sk.testData.CSVHEADERS_CONVERSATION[0]] === 'number' && typeof curRow[this.sk.testData.CSVHEADERS_CONVERSATION[1]] === 'string' && curRow[this.sk.testData.CSVHEADERS_CONVERSATION[2]] != null;
    }

    createCompareRow(curRow, priorRow) {
        return {
            curRow,
            priorRow
        }
    }

    /**
     * Represents a location in space and time along a path
     */
    createMovementPoint(curRow, movementPointArray) {
        return {
            xPos: curRow[this.HEADERS[1]],
            yPos: curRow[this.HEADERS[2]],
            time: curRow[this.HEADERS[0]],
            isStopped: this.testIsStopped(curRow, movementPointArray)
        }
    }

    testIsStopped(curRow, movementPointArray) {
        if (movementPointArray.length === 0) return true; // if it has not been filled, return true for isStopped value
        else return this.pointsHaveSamePosition(curRow, movementPointArray[movementPointArray.length - 1]);
    }

    pointsHaveSamePosition(curRow, lastMovementPoint) {
        return curRow[this.HEADERS[1]] === lastMovementPoint.xPos && curRow[this.HEADERS[2]] === lastMovementPoint.yPos;
    }

    /**
     * Represents a single conversation turn with a location in space and time, text values, name of a speaker, and what they said
     */
    createConversationPoint(movementPoint, curConversationRow) {
        return {
            xPos: movementPoint.xPos, // Float x and y pixel positions on floor plan
            yPos: movementPoint.yPos,
            isStopped: movementPoint.isStopped,
            time: curConversationRow[this.sk.testData.CSVHEADERS_CONVERSATION[0]], // Float Time value in seconds
            speaker: this.sk.core.cleanSpeaker(curConversationRow[this.sk.testData.CSVHEADERS_CONVERSATION[1]]), // String name of speaker
            talkTurn: curConversationRow[this.sk.testData.CSVHEADERS_CONVERSATION[2]] // String text of conversation turn
        }
    }

    clear() {
        this.parsedMovementFileData = [];
        this.sk.core.clearMovementData();
    }
}