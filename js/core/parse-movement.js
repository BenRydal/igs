class ParseMovement {

    constructor(sketch) {
        this.sk = sketch;
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
        if (this.sk.testData.testParsedMovementResults(results)) {
            if (fileNum === 0) this.clear(); // clear existing movement data for first new file only
            const pathName = this.sk.core.cleanPathName(file.name);
            this.updateParsedMovementFileData(results.data, pathName);
            this.updatePointArrays(results.data, pathName);
        } else alert("Error loading movement file. Please make sure your file is a .CSV file formatted with column headers: " + this.headersMovement.toString());
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
            if (this.sk.testData.movementRowForType(rows.curRow) && this.sk.testData.compareTimes(rows)) {
                const m = this.createMovementPoint(rows.curRow, movementPointArray);
                movementPointArray.push(m);
                if (conversationCounter < parsedConversationArray.length) { // this test both makes sure conversationArray is loaded and counter is not great than length
                    const curConversationRow = parsedConversationArray[conversationCounter];
                    if (this.sk.testData.conversationRowForType(curConversationRow) && m.time >= curConversationRow[this.sk.testData.headersConversation[0]]) {
                        conversationPointArray.push(this.createConversationPoint(m, curConversationRow));
                        conversationCounter++;
                    } else if (!this.sk.testData.conversationRowForType(curConversationRow)) conversationCounter++; // make sure to increment counter if bad data to skip row in next iteration of loop
                }
            }
        }
        return [movementPointArray, conversationPointArray];
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
            xPos: curRow[this.sk.testData.headersMovement[1]],
            yPos: curRow[this.sk.testData.headersMovement[2]],
            time: curRow[this.sk.testData.headersMovement[0]],
            isStopped: this.sk.testData.isStopped(curRow, movementPointArray)
        }
    }

    /**
     * Represents a single conversation turn with a location in space and time, text values, name of a speaker, and what they said
     */
    createConversationPoint(movementPoint, curConversationRow) {
        return {
            xPos: movementPoint.xPos, // Float x and y pixel positions on floor plan
            yPos: movementPoint.yPos,
            isStopped: movementPoint.isStopped,
            time: curConversationRow[this.sk.testData.headersConversation[0]], // Float Time value in seconds
            speaker: this.sk.core.cleanSpeaker(curConversationRow[this.sk.testData.headersConversation[1]]), // String name of speaker
            talkTurn: curConversationRow[this.sk.testData.headersConversation[2]] // String text of conversation turn
        }
    }

    clear() {
        this.parsedMovementFileData = [];
        this.sk.core.clearMovementData();
    }
}