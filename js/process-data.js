class ProcessData {

    constructor(sketch) {
        this.sketch = sketch;
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
        if (testData.movementResults(results)) {
            const [movement, conversation] = this.createMovementConversationArrays(results, this.sketch.core.conversationFileResults);
            this.sketch.core.updateMovement(fileNum, results, file, movement, conversation);
        } else alert("Error loading movement file. Please make sure your file is a .CSV file formatted with column headers: " + testData.CSVHEADERS_MOVEMENT.toString());
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
        if (testData.conversationResults(results)) {
            this.sketch.core.updateConversation(results);
            this.reProcessMovementFiles(this.sketch.core.movementFileResults); // must reprocess movement
        } else alert("Error loading conversation file. Please make sure your file is a .CSV file formatted with column headers: " + testData.CSVHEADERS_CONVERSATION.toString());

    }

    reProcessMovementFiles(movementFileResults) {
        for (const results of movementFileResults) {
            const [movement, conversation] = this.createMovementConversationArrays(results[0], this.sketch.core.conversationFileResults);
            this.sketch.core.updatePaths(movementFileResults[1], movement, conversation);
        }
    }

    /**
     * Returns clean movement and conversation arrays of MovementPoint and ConversationPoint objects
     * Location data for conversation array is drawn from comparison to movement file/results data
     *  @param  {PapaParse Results []} results
     */
    createMovementConversationArrays(results, conversationFileResults) {
        let movement = []; // Create empty arrays to hold MovementPoint and ConversationPoint objects
        let conversation = [];
        let conversationCounter = 0; // Current row count of conversation file for comparison
        for (let i = 0; i < results.data.length; i++) {
            // Sample current movement row and test if row is good data
            if (testData.sampleMovementData(results.data, i) && testData.movementRowForType(results.data, i)) {
                const m = this.createMovementPoint(results.data[i][testData.CSVHEADERS_MOVEMENT[1]], results.data[i][testData.CSVHEADERS_MOVEMENT[2]], results.data[i][testData.CSVHEADERS_MOVEMENT[0]]);
                movement.push(m); // add good data to movement []
                // Test conversation data row for quality first and then compare movement and conversation times to see if closest movement data to conversation time
                if (testData.conversationLengthAndRowForType(conversationFileResults, conversationCounter) && m.time >= conversationFileResults[conversationCounter][testData.CSVHEADERS_CONVERSATION[0]]) {
                    const curTalkTimePos = conversationFileResults[conversationCounter][testData.CSVHEADERS_CONVERSATION[0]];
                    const curSpeaker = this.sketch.core.cleanSpeaker(conversationFileResults[conversationCounter][testData.CSVHEADERS_CONVERSATION[1]]);
                    const curTalkTurn = conversationFileResults[conversationCounter][testData.CSVHEADERS_CONVERSATION[2]];
                    conversation.push(this.createConversationPoint(m.xPos, m.yPos, curTalkTimePos, curSpeaker, curTalkTurn));
                    conversationCounter++;
                } else if (!testData.conversationLengthAndRowForType(conversationFileResults, conversationCounter)) conversationCounter++; // make sure to increment counter if bad data to skip row in next iteration of loop
            }
        }
        return [movement, conversation];
    }

    /**
     * Represents a location in space and time along a path
     */
    createMovementPoint(xPos, yPos, time) {
        return {
            xPos, // Float x and y pixel positions on floor plan
            yPos,
            time // Float time value in seconds
        }
    }

    /**
     * Represents a single conversation turn with a location in space and time, text values, name of a speaker, and what they said
     */
    createConversationPoint(xPos, yPos, time, speaker, talkTurn) {
        return {
            xPos, // Float x and y pixel positions on floor plan
            yPos,
            time, // Float Time value in seconds
            speaker, // String name of speaker
            talkTurn // String text of conversation turn
        }
    }
}