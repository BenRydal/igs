class ParseMovement {

    constructor(sketch) {
        this.sk = sketch;
        //this.headers = ['time', 'x', 'y'];
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
        if (this.sk.testData.movementResults(results)) {
            if (fileNum === 0) this.clear(); // clear existing movement data for first new file only
            const pathName = file.name.charAt(0).toUpperCase();
            this.updateParsedMovementFileData(results.data, pathName);
            this.updatePointArrays(results.data, pathName);
        } else alert("Error loading movement file. Please make sure your file is a .CSV file formatted with column headers: " + this.sk.testData.CSVHEADERS_MOVEMENT.toString());
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

    reProcessFiles() {
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
        let movementPointArray = []; // Create empty arrays to hold MovementPoint and ConversationPoint objects
        let conversationPointArray = [];
        let conversationCounter = 0; // Current row count of conversation file for comparison
        for (let i = 0; i < parsedMovementArray.length; i++) {
            // Sample current movement row and test if row is good data
            if (this.sk.testData.sampleMovementData(parsedMovementArray, i) && this.sk.testData.movementRowForType(parsedMovementArray, i)) {
                const m = this.createMovementPoint(parsedMovementArray[i][this.sk.testData.CSVHEADERS_MOVEMENT[1]], parsedMovementArray[i][this.sk.testData.CSVHEADERS_MOVEMENT[2]], parsedMovementArray[i][this.sk.testData.CSVHEADERS_MOVEMENT[0]]);
                if (movementPointArray.length === 0) m.isStopped = true; // set isStopped value based on comparison to prior point unless it is 1st point
                else m.isStopped = this.pointsHaveSamePosition(m, movementPointArray[movementPointArray.length - 1]);
                movementPointArray.push(m); // add good data to movement []
                if (this.sk.testData.arrayIsLoaded(parsedConversationArray) && conversationCounter < parsedConversationArray.length) {
                    // Test conversation data row for quality first and then compare movement and conversation times to see if closest movement data to conversation time
                    if (this.sk.testData.conversationRowForType(parsedConversationArray, conversationCounter) && m.time >= parsedConversationArray[conversationCounter][this.sk.testData.CSVHEADERS_CONVERSATION[0]]) {
                        const c = this.getCurConversationValues(parsedConversationArray, conversationCounter);
                        conversationPointArray.push(this.createConversationPoint(m, c));
                        conversationCounter++;
                    } else if (!this.sk.testData.conversationRowForType(parsedConversationArray, conversationCounter)) conversationCounter++; // make sure to increment counter if bad data to skip row in next iteration of loop
                }
            }
        }
        return [movementPointArray, conversationPointArray];
    }

    pointsHaveSamePosition(curPoint, priorPoint) {
        return (curPoint.xPos === priorPoint.xPos && curPoint.yPos === priorPoint.yPos);
    }

    getCurConversationValues(parsedConversationArray, conversationCounter) {
        return {
            time: parsedConversationArray[conversationCounter][this.sk.testData.CSVHEADERS_CONVERSATION[0]],
            speaker: this.sk.core.cleanSpeaker(parsedConversationArray[conversationCounter][this.sk.testData.CSVHEADERS_CONVERSATION[1]]),
            talkTurn: parsedConversationArray[conversationCounter][this.sk.testData.CSVHEADERS_CONVERSATION[2]]
        }
    }

    /**
     * Represents a location in space and time along a path
     */
    createMovementPoint(xPos, yPos, time) {
        return {
            xPos, // Float x and y pixel positions on floor plan
            yPos,
            time, // Float time value in seconds
            isStopped: null // value set after comparing to previous point in createPointArrays
        }
    }

    /**
     * Represents a single conversation turn with a location in space and time, text values, name of a speaker, and what they said
     */
    createConversationPoint(m, c) {
        return {
            xPos: m.xPos, // Float x and y pixel positions on floor plan
            yPos: m.yPos,
            isStopped: m.isStopped,
            time: c.time, // Float Time value in seconds
            speaker: c.speaker, // String name of speaker
            talkTurn: c.talkTurn // String text of conversation turn
        }
    }

    clear() {
        this.parsedMovementFileData = [];
        this.sk.core.clearMovementData();
    }
}