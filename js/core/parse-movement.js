class ParseMovement {

    constructor(sketch, testData) {
        this.sk = sketch;
        this.testData = testData;
        this.parsedFileArray = []; // Each index of array holds a PapaParse results.data array and string/character for name of path
    }

    /**
     * This method is important for binding this to callback
     * @param  {CSV File Array} fileList
     */
    prepFiles(fileList) {
        this.parseFiles(fileList, this.processFiles.bind(this));
    }

    /**
     * Handles async loading of movement files. 
     * NOTE: folder and filename are separated for convenience later in program
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
     * Parses file and sends for further testing/processing
     * @param  {CSV File Array} fileList
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

    /**
     * Organizes custom tests of parsed file, clearing of existing data and updating both parsedFileArray and program data
     * @param  {Papaparse results Array} results
     * @param  {File} file
     * @param  {Integer} fileNum // used to clear existing movement data for first new file only
     */
    processFiles(results, file, fileNum) {
        console.log("Parsing complete:", results, file);
        if (this.testData.parsedResults(results, this.testData.headersMovement, this.testData.movementRowForType)) {
            if (fileNum === 0) this.clear(); // clear existing movement data for first new file only
            const pathName = this.testData.cleanFileName(file.name);
            this.parsedFileArray.push({
                parsedMovementArray: results.data,
                firstCharOfFileName: pathName
            });
            this.processPointArrays(results.data, pathName);
        } else alert("Error loading movement file. Please make sure your file is a .CSV file formatted with column headers: " + this.testData.headersMovement.toString());
    }

    processPointArrays(resultsDataArray, pathName) {
        const [movementPointArray, conversationPointArray] = this.createPointArrays(resultsDataArray, this.sk.core.parseConversation.getParsedFileArray());
        this.sk.core.updateMovement(pathName, movementPointArray, conversationPointArray);
    }

    reProcessAllPointArrays() {
        for (const index of this.parsedFileArray) {
            this.processPointArrays(index.parsedMovementArray, index.firstCharOfFileName);
        }
    }

    /**
     * Returns clean arrays of MovementPoint and ConversationPoint objects
     * ConversationPoint attributes draw from MovementPoint with first time value that is larger that time value at current conversation row in table
     * NOTE: conversationCounter is used/updated to efficiently manage joining of movement/conversationPoint attributes
     * TODO: consider how best to implement movement/curTimeLarger tests in the future
     * @param  {PapaParse results.data Array} parsedMovementArray
     * @param  {PapaParse results.data Array} parsedConversationArray
     */
    createPointArrays(parsedMovementArray, parsedConversationArray) {
        let movementPointArray = [];
        let conversationPointArray = [];
        let conversationCounter = 0; // Current row count of conversation file for comparison
        for (let i = 1; i < parsedMovementArray.length; i++) {
            const rows = this.createCompareRow(parsedMovementArray[i], parsedMovementArray[i - 1]); // Comparing cur and prior rows is important to sample data and evaluate isStopped points
            if (this.testData.movementRowForType(rows.curRow) && this.testData.curTimeIsLarger(rows.curRow, rows.priorRow)) {
                const m = this.createMovementPoint(rows.curRow, movementPointArray);
                movementPointArray.push(m);
                if (conversationCounter < parsedConversationArray.length) { // this test both makes sure conversationArray is loaded and counter is not great than length
                    const curConversationRow = parsedConversationArray[conversationCounter];
                    if (this.testData.conversationRowForType(curConversationRow) && this.testData.movementTimeIsLarger(m.time, curConversationRow)) {
                        conversationPointArray.push(this.createConversationPoint(m, curConversationRow));
                        conversationCounter++;
                    } else if (!this.testData.conversationRowForType(curConversationRow)) conversationCounter++; // make sure to increment counter if bad data to skip row in next iteration of loop
                }
            }
        }
        return [movementPointArray, conversationPointArray];
    }

    /**
     * This object is used to compare values from current and prior points
     */
    createCompareRow(curRow, priorRow) {
        return {
            curRow,
            priorRow
        }
    }

    /**
     * Represents a location in space and time along a path with other attributes
     */
    createMovementPoint(curRow, movementPointArray) {
        return {
            time: curRow[this.testData.headersMovement[0]],
            xPos: curRow[this.testData.headersMovement[1]],
            yPos: curRow[this.testData.headersMovement[2]],
            isStopped: this.testData.isStopped(curRow, movementPointArray),
            codeArray: this.sk.core.parseCodes.addCodeArray(curRow[this.testData.headersMovement[0]])
        }
    }

    /**
     * Represents a single conversation turn with a location in space and time
     * NOTE: Movement Point attributes are passed to create some attributes for a Conversation Point
     * TODO: consider if time should also equal movementPoint.time in future, allowing conversationPoint to hold a movementPoint object
     */
    createConversationPoint(movementPoint, curConversationRow) {
        return {
            time: curConversationRow[this.testData.headersConversation[0]],
            xPos: movementPoint.xPos,
            yPos: movementPoint.yPos,
            isStopped: movementPoint.isStopped,
            codeArray: movementPoint.codeArray,
            speaker: this.testData.cleanSpeaker(curConversationRow[this.testData.headersConversation[1]]), // String name of speaker
            talkTurn: curConversationRow[this.testData.headersConversation[2]] // String text of conversation turn
        }
    }

    clear() {
        this.parsedFileArray = [];
        this.sk.core.clearMovement();
    }
}