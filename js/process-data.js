/**
 * NOTE: Speaker and path objects are separate due to how P5.js draws shapes in the browser.
 * NOTE: Each speaker and path object can match/correspond to the same person but they don't have to match.
 * This allows variation in the number of movement files and speakers listed.
 */

/**
 * Represents collection of data that comprises an individual speaker
 * NOTE: constructed from conversation .CSV file
 */
class Speaker {
    constructor(name, col) {
        this.name = name; // char indicating letter of speaker
        this.color = col; // color set to gray to start, updated to match corresponding Path if one exists in processMovement
        this.show = true; // boolean indicating speaker is showing in GUI
    }
}

/**
 * Represents collection of data that comrpises a path
 * NOTE: constructed from movement .CSV file
 */
class Path {
    constructor(pathName) {
        this.movement = []; // List of Point_Movement objects
        this.conversation = []; // List of Point_Conversation objects
        this.name = pathName; // Char indicating letter name of path. Matches first letter of movement file name and created when Path is instantiated.
        this.color = undefined; // Color of path, set in processMovement
        this.show = true; // boolean indicates if path is showing/selected
    }
}

/**
 * Represents a point on a path
 * NOTE: constructed from each row/case in a .CSV movement file
 */
class Point_Movement {
    constructor(xPos, yPos, time) {
        this.xPos = xPos; // Number x and y position used to set pixel position
        this.yPos = yPos;
        this.time = time; // Time value in seconds
    }
}

/**
 * Represents a point with conversation on a path
 * NOTE: constructed from both .CSV movement and conversation files
 */
class Point_Conversation {
    constructor(xPos, yPos, time, speaker, talkTurn) {
        this.xPos = xPos; // Number x and y positions used to set pixel position, constructed from movement .CSV file
        this.yPos = yPos;
        this.time = time; // Time value in seconds
        this.speaker = speaker; // Char indicating letter name of speaker
        this.talkTurn = talkTurn; // String of text indicating spoken conversation
    }
}

class ProcessData {

    /**
     * Creates P5 image file from path
     * Updates global core.floorPlan image and input width/heights of core.floorPlan to properly scale and display data
     * @param  {String} filePath
     */
    processFloorPlan(filePath) {
        loadImage(filePath, img => {
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
     * Creates clean (good data) and sampled movement [] of Point_Movement objects and conversation []
     * of Point_Conversation objects from PapaParse movement results [].
     * To create the conversation [], a comparison between the global core.conversationFileResults [] 
     * at a specified index to the current Point_Movement time is made--this comparison is what 
     * determines when to create a new Conversation point if the current conversation row has good data
     * @param  {Results [] from PapaParse} results
     */
    processMovementFile(results) {
        let movement = []; // Create empty arrays to hold Point_Movement and Point_Conversation objects
        let conversation = [];
        let conversationCounter = 0;
        for (let i = 0; i < results.data.length; i++) {
            // Sample movement row and test if row is good data
            if (testData.sampleMovementData(results.data, i) && testData.movementRowForType(results.data, i)) {
                const m = this.createMovementPoint(results.data, i);
                movement.push(m); // always add to movement []
                // Test conversation data row for quality and if movement time is greater than conversationCounter time
                if (testData.conversationLengthAndRowForType(conversationCounter) && m.time >= core.conversationFileResults[conversationCounter][conversationHeaders[0]]) {
                    conversation.push(this.createConversationPoint(conversationCounter, m.xPos, m.yPos));
                    conversationCounter++;
                } else if (!testData.conversationLengthAndRowForType(conversationCounter)) conversationCounter++; // make sure to increment counter if bad data to skip row in next iteration of loop
            }
        }
        return [movement, conversation];
    }

    createMovementPoint(data, curRow) {
        let m = new Point_Movement();
        m.time = data[curRow][movementHeaders[0]];
        m.xPos = data[curRow][movementHeaders[1]];
        m.yPos = data[curRow][movementHeaders[2]];
        return m;
    }

    /**
     * Creates and adds new Path object to global core.paths []
     * Also handles updating global totalTime and sorting core.paths []
     * @param  {Char} letterName
     * @param  {Point_Movement []} movement
     * @param  {Point_Conversation []} conversation
     */
    updatePaths(letterName, movement, conversation) {
        let p = new Path(letterName); // initialize with name and grey/black color
        p.movement = movement;
        p.conversation = conversation;
        if (dataIsLoaded(core.speakerList)) p.color = this.setPathColorBySpeaker(p.name); // if conversation file loaded, send to method to calculate color
        else p.color = colorList[core.paths.length % colorList.length]; // if no conversation file loaded path color is next in Color list
        core.paths.push(p);
        core.paths.sort((a, b) => (a.name > b.name) ? 1 : -1); // sort list so it appears nicely in GUI matching core.speakerList array
        const curPathEndTime = Math.floor(movement[movement.length - 1].time);
        if (core.totalTimeInSeconds < curPathEndTime) core.totalTimeInSeconds = curPathEndTime; // update global total time, make sure to floor value as integer
    }

    /**
     * Returns color based on whether pathName has corresponding speaker
     * If path has corresponding speaker, color returned matches speaker
     * If it does not, color returned selects from global colorList based on num of speakers + numOfPaths that do not have corresponding speaker
     * 
     * @param  {} pathName
     */
    setPathColorBySpeaker(pathName) {
        if (core.speakerList.some(e => e.name === pathName)) {
            const hasSameName = (element) => element.name === pathName; // condition to satisfy/does it have pathName
            return core.speakerList[core.speakerList.findIndex(hasSameName)].color; // returns first index that satisfies condition/index of speaker that matches pathName
        } else return colorList[core.speakerList.length + this.getNumPathsWithNoSpeaker() % colorList.length]; // assign color to path
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
     * Creates Point_Conversation object
     * NOTE: parameters are from movement data
     * @param  {Integer} index
     * @param  {Number/Float} xPos
     * @param  {Number/Float} yPos
     */
    createConversationPoint(index, xPos, yPos) {
        let c = new Point_Conversation();
        c.xPos = xPos; // set to x/y pos in movement file case
        c.yPos = yPos;
        c.time = core.conversationFileResults[index][conversationHeaders[0]];
        c.speaker = this.cleanSpeaker(core.conversationFileResults[index][conversationHeaders[1]]); // get cleaned speaker character
        c.talkTurn = core.conversationFileResults[index][conversationHeaders[2]];
        return c;
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
                const speaker = this.cleanSpeaker(core.conversationFileResults[i][conversationHeaders[1]]); // get cleaned speaker character
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
        core.speakerList.push(new Speaker(name, colorList[core.speakerList.length % colorList.length]));
    }

    // Initialization for the video player
    processVideo(platform, params) {
        if (dataIsLoaded(videoPlayer)) videoPlayer.destroy();
        // Based on the specified platform, chose the appropriate type of videoPlayer to use
        switch (platform) {
            case "Youtube":
                videoPlayer = new YoutubePlayer(params);
                break;
            case "File":
                videoPlayer = new P5FilePlayer(params);
                break;
        }
    }
}