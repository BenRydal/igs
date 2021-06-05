class ProcessData {

    /**
     * Creates P5 image file from path
     * Updates global core.floorPlan image and input width/heights of core.floorPlan to properly scale and display data
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

    // Initialization for the video player
    // Based on the specified platform, chose the appropriate type of videoPlayer to use
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
     * Creates clean (good data) and sampled movement [] of MovementPoint objects and conversation []
     * of ConversationPoint objects from PapaParse movement results [].
     * To create the conversation [], a comparison between the global core.conversationFileResults [] 
     * at a specified index to the current MovementPoint time is made--this comparison is what 
     * determines when to create a new Conversation point if the current conversation row has good data
     * @param  {Results [] from PapaParse} results
     */
    processMovementFile(results) {
        let movement = []; // Create empty arrays to hold MovementPoint and ConversationPoint objects
        let conversation = [];
        let conversationCounter = 0;
        for (let i = 0; i < results.data.length; i++) {
            // Sample movement row and test if row is good data
            if (testData.sampleMovementData(results.data, i) && testData.movementRowForType(results.data, i)) {
                const m = core.createMovementPoint(results.data[i][CSVHEADERS_MOVEMENT[1]], results.data[i][CSVHEADERS_MOVEMENT[2]], results.data[i][CSVHEADERS_MOVEMENT[0]]);
                movement.push(m);
                // Test conversation data row for quality first and then compare movement and conversation times
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
     * Creates and adds new Path object to global core.paths []
     * Also handles updating global totalTime and sorting core.paths []
     * @param  {Char} letterName
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
     * Returns color based on whether pathName has corresponding speaker
     * If path has corresponding speaker, color returned matches speaker
     * If it does not, color returned selects from global COLOR_LIST based on num of speakers + numOfPaths that do not have corresponding speaker
     * 
     * @param  {} pathName
     */
    setPathColorBySpeaker(pathName) {
        if (core.speakerList.some(e => e.name === pathName)) {
            const hasSameName = (element) => element.name === pathName; // condition to satisfy/does it have pathName
            return core.speakerList[core.speakerList.findIndex(hasSameName)].color; // returns first index that satisfies condition/index of speaker that matches pathName
        } else return COLOR_LIST[core.speakerList.length + this.getNumPathsWithNoSpeaker() % COLOR_LIST.length]; // assign color to path
    }

    /**
     * Returns number of movement core.paths that do not have corresponding speaker
     */
    getNumPathsWithNoSpeaker() {
        let count = 0;
        for (let i = 0; i < core.paths.length; i++) {
            if (!core.speakerList.some(e => e.name === core.paths[i].name)) count++;
        }
        return count;
    }

    /**
     * Updates global speaker list from conversation file data/results
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