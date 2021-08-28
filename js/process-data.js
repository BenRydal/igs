class ProcessData {

    constructor(sketch) {
        this.sk = sketch;
    }

    /**
     * Prepare for parsing. Important for binding this to callback
     * @param  {.CSV File[]} fileList
     */
    prepMovementFiles(fileList) {
        this.parseMovementFiles(fileList, this.processMovementFile.bind(this));
    }

    /**
     * Prepare for parsing. Important for binding this to callback
     * @param  {.CSV File} file
     */
    prepConversationFile(file) {
        this.parseConversationFile(file, this.processConversationFile.bind(this));

    }

    /**
     * Handles async loading of movement files. NOTE: folder and filename are separated for convenience later in program
     * @param  {String} folder
     * @param  {String} fileNames
     */
    async prepExampleMovementFiles(folder, fileNames) {
        try {
            let fileList = [];
            for (const name of fileNames) {
                const response = await fetch(new Request(folder + name));
                const buffer = await response.arrayBuffer();
                fileList.push(new File([buffer], name, {
                    type: "text/csv",
                }));
            }
            // parse file after retrieval, maintain correct this context on callback with bind
            this.parseMovementFiles(fileList, this.processMovementFile.bind(this));
        } catch (error) {
            alert("Error loading example movement data. Please make sure you have a good internet connection")
            console.log(error);
        }
    }

    /**
     * Handles async loading of conversation file. NOTE: folder and filename are separated for convenience later in program
     * @param  {String} folder
     * @param  {String} fileName
     */
    async prepExampleConversationFile(folder, fileName) {
        try {
            const response = await fetch(new Request(folder + fileName));
            const buffer = await response.arrayBuffer();
            const file = new File([buffer], fileName, {
                type: "text/csv",
            });
            // parse file after retrieval, maintain correct this context on callback with bind
            this.parseConversationFile(file, this.processConversationFile.bind(this));
        } catch (error) {
            alert("Error loading example conversation data. Please make sure you have a good internet connection")
            console.log(error);
        }
    }

    /**
     * Parse input files and send to processData method
     * @param  {.CSV File[]} fileList
     */
    parseMovementFiles(fileList, callback) {
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

    processMovementFile(results, file, fileNum) {
        console.log("Parsing complete:", results, file);
        if (this.sk.testData.movementResults(results)) {
            const [movementPointArray, conversationPointArray] = this.createPointArrays(results.data, this.sk.core.parsedConversationArray);
            this.sk.core.updateMovement(fileNum, results.data, file, movementPointArray, conversationPointArray);
        } else alert("Error loading movement file. Please make sure your file is a .CSV file formatted with column headers: " + this.sk.testData.CSVHEADERS_MOVEMENT.toString());
    }

    /**
     * Parse input files and send to processData method
     * @param  {.CSV File} file
     */
    parseConversationFile(file, callback) {
        Papa.parse(file, {
            complete: (results, parsedFile) => callback(results, parsedFile),
            error: (error, parsedFile) => {
                alert("Parsing error with your conversation file. Please make sure your file is formatted correctly as a .CSV");
                console.log(error, parsedFile);
            },
            header: true,
            dynamicTyping: true,
        });
    }

    processConversationFile(results, file) {
        console.log("Parsing complete:", results, file);
        if (this.sk.testData.conversationResults(results)) {
            this.sk.core.updateConversation(results.data);
            this.reProcessMovementFiles(this.sk.core.parsedMovementFileData); // must reprocess movement
        } else alert("Error loading conversation file. Please make sure your file is a .CSV file formatted with column headers: " + this.sk.testData.CSVHEADERS_CONVERSATION.toString());

    }

    reProcessMovementFiles(parsedMovementFileData) {
        for (const index of parsedMovementFileData) {
            const [movementPointArray, conversationPointArray] = this.createPointArrays(index.parsedMovementArray, this.sk.core.parsedConversationArray);
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

                if (movementPointArray.length === 0) m.isStopped = true;
                else m.isStopped = this.pointsHaveSamePosition(m, movementPointArray[movementPointArray.length - 1]);

                movementPointArray.push(m); // add good data to movement []
                // Test conversation data row for quality first and then compare movement and conversation times to see if closest movement data to conversation time
                if (this.sk.testData.conversationLengthAndRowForType(parsedConversationArray, conversationCounter) && m.time >= parsedConversationArray[conversationCounter][this.sk.testData.CSVHEADERS_CONVERSATION[0]]) {
                    const curTalkTimePos = parsedConversationArray[conversationCounter][this.sk.testData.CSVHEADERS_CONVERSATION[0]];
                    const curSpeaker = this.sk.core.cleanSpeaker(parsedConversationArray[conversationCounter][this.sk.testData.CSVHEADERS_CONVERSATION[1]]);
                    const curTalkTurn = parsedConversationArray[conversationCounter][this.sk.testData.CSVHEADERS_CONVERSATION[2]];
                    conversationPointArray.push(this.createConversationPoint(m, curTalkTimePos, curSpeaker, curTalkTurn));
                    conversationCounter++;
                } else if (!this.sk.testData.conversationLengthAndRowForType(parsedConversationArray, conversationCounter)) conversationCounter++; // make sure to increment counter if bad data to skip row in next iteration of loop
            }
        }
        return [movementPointArray, conversationPointArray];
    }

    pointsHaveSamePosition(curPoint, priorPoint) {
        return (curPoint.xPos === priorPoint.xPos && curPoint.yPos === priorPoint.yPos);
    }

    /**
     * Represents a location in space and time along a path
     */
    createMovementPoint(xPos, yPos, time) {
        return {
            xPos, // Float x and y pixel positions on floor plan
            yPos,
            time, // Float time value in seconds
            isStopped: null
        }
    }

    /**
     * Represents a single conversation turn with a location in space and time, text values, name of a speaker, and what they said
     */
    createConversationPoint(m, time, speaker, talkTurn) {
        return {
            xPos: m.xPos, // Float x and y pixel positions on floor plan
            yPos: m.yPos,
            isStopped: m.isStopped,
            time, // Float Time value in seconds
            speaker, // String name of speaker
            talkTurn // String text of conversation turn
        }
    }
}