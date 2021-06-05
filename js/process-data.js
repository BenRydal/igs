class ProcessData {

    /**
     * Creates P5 image file from path and updates core floorPlan image and input width/heights to properly scale and display data
     * @param  {String} filePath
     */
    processFloorPlan(filePath) {
        loadImage(filePath, img => {
            console.log("Floor Plan Image Loaded");
            loop(); // rerun P5 draw loop after loading image
            core.floorPlan = img;
            core.inputFloorPlanPixelWidth = core.floorPlan.width;
            core.inputFloorPlanPixelHeight = core.floorPlan.height;
            img.onload = function () {
                URL.revokeObjectURL(this.src);
            }
        }, e => {
            alert("Error loading floor plan image file. Please make sure it is correctly formatted as a PNG or JPG image file.")
            console.log(e);
        });
    }

    /**
     * Replaces existing videoPlayer object with new VideoPlayer object (YouTube or P5FilePlayer)
     * @param  {String} platform
     * @param  {VideoPlayer Specific Params} params
     */
    processVideo(platform, params) {
        if (testData.dataIsLoaded(videoPlayer)) videoPlayer.destroy();
        switch (platform) {
            case "Youtube":
                videoPlayer = new YoutubePlayer(params);
                break;
            case "File":
                videoPlayer = new P5FilePlayer(params);
                break;
        }
    }

    /** 
     * Organizes methods to process and update core movementFileResults []
     * @param  {PapaParse Results []} results
     * @param {CSV} file
     */
    processMovement(results, file) {
        const pathName = file.name.charAt(0).toUpperCase(); // get name of path, also used to test if associated speaker in conversation file
        const [movement, conversation] = this.createMovementConversationArrays(results); //
        this.updatePaths(pathName, movement, conversation);
        core.movementFileResults.push([results, pathName]); // add results and pathName to core []
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
                const m = core.createMovementPoint(results.data[i][CSVHEADERS_MOVEMENT[1]], results.data[i][CSVHEADERS_MOVEMENT[2]], results.data[i][CSVHEADERS_MOVEMENT[0]]);
                movement.push(m); // add good data to movement []
                // Test conversation data row for quality first and then compare movement and conversation times to see if closest movement data to conversation time
                if (testData.conversationLengthAndRowForType(conversationCounter) && m.time >= core.conversationFileResults[conversationCounter][CSVHEADERS_CONVERSATION[0]]) {
                    const curTalkTimePos = core.conversationFileResults[conversationCounter][CSVHEADERS_CONVERSATION[0]];
                    const curSpeaker = this.cleanSpeaker(core.conversationFileResults[conversationCounter][CSVHEADERS_CONVERSATION[1]]);
                    const curTalkTurn = core.conversationFileResults[conversationCounter][CSVHEADERS_CONVERSATION[2]];
                    conversation.push(core.createConversationPoint(m.xPos, m.yPos, curTalkTimePos, curSpeaker, curTalkTurn));
                    conversationCounter++;
                } else if (!testData.conversationLengthAndRowForType(conversationCounter)) conversationCounter++; // make sure to increment counter if bad data to skip row in next iteration of loop
            }
        }
        return [movement, conversation];
    }

    /**
     * Adds new Path object to and sorts core paths []. Also updates time in seconds in program 
     * @param  {char} letterName
     * @param  {MovementPoint []} movement
     * @param  {ConversationPoint []} conversation
     */
    updatePaths(letterName, movement, conversation) {
        let curPathColor;
        if (testData.dataIsLoaded(core.speakerList)) curPathColor = this.setPathColorBySpeaker(letterName); // if conversation file loaded, send to method to calculate color
        else curPathColor = COLOR_LIST[core.paths.length % COLOR_LIST.length]; // if no conversation file loaded path color is next in Color list
        let p = core.createPath(letterName, movement, conversation, curPathColor, true); // initialize with name, movement [] and conversation []
        core.paths.push(p);
        core.paths.sort((a, b) => (a.name > b.name) ? 1 : -1); // sort list so it appears nicely in GUI matching core.speakerList array
        const curPathEndTime = Math.floor(movement[movement.length - 1].time);
        if (core.totalTimeInSeconds < curPathEndTime) core.totalTimeInSeconds = curPathEndTime; // update global total time, make sure to floor value as integer
    }

    /**
     * If path has corresponding speaker, returns color that matches speaker
     * Otherwise returns color from global COLOR_LIST based on num of speakers + numOfPaths that do not have corresponding speaker
     * @param  {char} pathName
     */
    setPathColorBySpeaker(pathName) {
        if (core.speakerList.some(e => e.name === pathName)) {
            const hasSameName = (element) => element.name === pathName; // condition to satisfy/does it have pathName
            return core.speakerList[core.speakerList.findIndex(hasSameName)].color; // returns first index that satisfies condition/index of speaker that matches pathName
        } else return COLOR_LIST[core.speakerList.length + this.getNumPathsWithNoSpeaker() % COLOR_LIST.length]; // assign color to path
    }

    /**
     * Returns number of movement Paths that do not have corresponding speaker
     */
    getNumPathsWithNoSpeaker() {
        let count = 0;
        for (let i = 0; i < core.paths.length; i++) {
            if (!core.speakerList.some(e => e.name === core.paths[i].name)) count++;
        }
        return count;
    }

    /** 
     * Organizes methods to process and update conversationFileResults
     * @param  {PapaParse Results []} results
     */
    processConversation(results) {
        core.conversationFileResults = results.data; // set to new array of keyed values
        this.updateSpeakerList();
        core.speakerList.sort((a, b) => (a.name > b.name) ? 1 : -1); // sort list so it appears nicely in GUI matching core.paths array
        // Reprocess existing movement files
        for (let i = 0; i < core.movementFileResults.length; i++) {
            const [movement, conversation] = this.createMovementConversationArrays(core.movementFileResults[i][0]); // Reprocess movement file results
            this.updatePaths(core.movementFileResults[i][1], movement, conversation); // Pass movement file pathname and reprocessed movement file results to updatepaths
        }
    }

    /**
     * Updates core speaker list from conversation file data/results
     */
    updateSpeakerList() {
        for (let i = 0; i < core.conversationFileResults.length; i++) {
            let tempSpeakerList = []; // create/populate temp list to store strings to test from global core.speakerList
            for (let j = 0; j < core.speakerList.length; j++) tempSpeakerList.push(core.speakerList[j].name);
            // If row is good data, test if core.speakerList already has speaker and if not add speaker 
            if (testData.conversationLengthAndRowForType(i)) {
                const speaker = this.cleanSpeaker(core.conversationFileResults[i][CSVHEADERS_CONVERSATION[1]]); // get cleaned speaker character
                if (!tempSpeakerList.includes(speaker)) this.addSpeakerToSpeakerList(speaker);
            }
        }
    }
    /**
     * From String, trims white space, converts to uppercase and returns sub string of 2 characters
     * @param  {String} s
     */
    cleanSpeaker(s) {
        return s.trim().toUpperCase().substring(0, 2);
    }

    /**
     * Adds new speaker object with initial color to global core.speakerList from character
     * @param  {Char} speaker
     */
    addSpeakerToSpeakerList(name) {
        core.speakerList.push(core.createSpeaker(name, COLOR_LIST[core.speakerList.length % COLOR_LIST.length], true));
    }
}