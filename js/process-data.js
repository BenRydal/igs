class ProcessData {

    /**
     * Clears existing movement data and parses each movement file and sends for additional testing and processing
     * @param  {.CSV File[]} fileList
     */
    parseMovementFiles(fileList) {
        for (let fileNum = 0; fileNum < fileList.length; fileNum++) {
            Papa.parse(fileList[fileNum], {
                complete: (results, file) => processData.processMovementFile(results, file, fileNum),
                header: true,
                dynamicTyping: true,
            });
        }
    }

    processMovementFile(results, file, fileNum) {
        console.log("Parsing complete:", results, file);
        if (testData.movementResults(results)) {
            const [movement, conversation] = this.createMovementConversationArrays(results);
            core.updateMovement(fileNum, results, file, movement, conversation);
        } else alert("Error loading movement file. Please make sure your file is a .CSV file formatted with column headers: " + CSVHEADERS_MOVEMENT.toString());
    }

    /**
     * Clears existing conversation data and parses single conversation file using PapaParse library and sends for additional testing and processing
     * @param  {.CSV File} file
     */
    parseConversationFile(file) {
        Papa.parse(file, {
            complete: (results, parsedFile) => processData.processConversationFile(results, parsedFile),
            header: true,
            dynamicTyping: true,
        });
    }

    processConversationFile(results, file) {
        console.log("Parsing complete:", results, file);
        if (testData.conversationResults(results)) {
            core.updateConversation(results);
            this.reProcessMovementFiles(core.movementFileResults); // must reprocess movement
        } else alert("Error loading conversation file. Please make sure your file is a .CSV file formatted with column headers: " + CSVHEADERS_CONVERSATION.toString());

    }

    reProcessMovementFiles(movementFileResults) {
        for (const results of movementFileResults) {
            const [movement, conversation] = this.createMovementConversationArrays(results[0]);
            core.updatePaths(results[1], movement, conversation);
        }
    }

    /**
     * Returns clean movement and conversation arrays of MovementPoint and ConversationPoint objects
     * Location data for conversation array is drawn from comparison to movement file/results data
     *  @param  {PapaParse Results []} results
     */
    createMovementConversationArrays(results) {
        let movement = []; // Create empty arrays to hold MovementPoint and ConversationPoint objects
        let conversation = [];
        let conversationCounter = 0; // Current row count of conversation file for comparison
        for (let i = 0; i < results.data.length; i++) {
            // Sample current movement row and test if row is good data
            if (testData.sampleMovementData(results.data, i) && testData.movementRowForType(results.data, i)) {
                const m = this.createMovementPoint(results.data[i][CSVHEADERS_MOVEMENT[1]], results.data[i][CSVHEADERS_MOVEMENT[2]], results.data[i][CSVHEADERS_MOVEMENT[0]]);
                movement.push(m); // add good data to movement []
                // Test conversation data row for quality first and then compare movement and conversation times to see if closest movement data to conversation time
                if (testData.conversationLengthAndRowForType(core.conversationFileResults, conversationCounter) && m.time >= core.conversationFileResults[conversationCounter][CSVHEADERS_CONVERSATION[0]]) {
                    const curTalkTimePos = core.conversationFileResults[conversationCounter][CSVHEADERS_CONVERSATION[0]];
                    const curSpeaker = core.cleanSpeaker(core.conversationFileResults[conversationCounter][CSVHEADERS_CONVERSATION[1]]);
                    const curTalkTurn = core.conversationFileResults[conversationCounter][CSVHEADERS_CONVERSATION[2]];
                    conversation.push(this.createConversationPoint(m.xPos, m.yPos, curTalkTimePos, curSpeaker, curTalkTurn));
                    conversationCounter++;
                } else if (!testData.conversationLengthAndRowForType(core.conversationFileResults, conversationCounter)) conversationCounter++; // make sure to increment counter if bad data to skip row in next iteration of loop
            }
        }
        return [movement, conversation];
    }

    /**
     * Object constructed from .CSV movement file representing a location in space and time along a path
     * @param  {Number} xPos // x and y pixel positions on floor plan
     * @param  {Number} time // time value in seconds
     */
    createMovementPoint(xPos, yPos, time) {
        return {
            xPos,
            yPos,
            time
        }
    }

    /**
     * Object constructed from .CSV movement AND conversation files representing a location
     * in space and time and String values of a single conversation turn
     * @param  {Number} xPos // x and y pixel positions on floor plan
     * @param  {Number} yPos
     * @param  {Number} time // Time value in seconds
     * @param  {String} speaker // Name of speaker
     * @param  {String} talkTurn // Text of conversation turn
     */
    createConversationPoint(xPos, yPos, time, speaker, talkTurn) {
        return {
            xPos,
            yPos,
            time,
            speaker,
            talkTurn
        }
    }

    /**
     * Handles asynchronous loading of example data from a selected example array of data
     * Process conversation then movement files
     * @param  {[String directory, String floorPlan image file, String conversation File, String movement File[], String video platform, video params (see Video Player Interface)]} params
     */
    async parseExampleData(params) {
        await this.getExampleConversationFile(params[0], params[2]).then(this.parseConversationFile);
        await this.getExampleMovementFiles(params[0], params[3]).then(this.parseMovementFiles);
    }

    /**
     * Handles async loading of conversation file
     * NOTE: folder and filename are separated for convenience later in program
     * @param  {String} folder
     * @param  {String} fileName
     */
    async getExampleConversationFile(folder, fileName) {
        const response = await fetch(new Request(folder + fileName));
        const buffer = await response.arrayBuffer();
        return new File([buffer], fileName, {
            type: "text/csv",
        });
    }
    /**
     * Handles async loading of movement file
     * NOTE: folder and filename are separated for convenience later in program
     * @param  {String} folder
     * @param  {String} fileNames
     */
    async getExampleMovementFiles(folder, fileNames) {
        let fileList = [];
        for (const name of fileNames) {
            const response = await fetch(new Request(folder + name));
            const buffer = await response.arrayBuffer();
            fileList.push(new File([buffer], name, {
                type: "text/csv",
            }));
        }
        return fileList;
    }
}