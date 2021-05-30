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
     * Updates global floorPlan image and input width/heights of floorPlan to properly scale and display data
     * @param  {String} filePath
     */
    processFloorPlan(filePath) {
        loadImage(filePath, img => {
            floorPlan = img;
            inputFloorPlanPixelWidth = floorPlan.width;
            inputFloorPlanPixelHeight = floorPlan.height;
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
     * To create the conversation [], a comparison between the global conversationFileResults [] 
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
            if (this.testSampleMovementData(results.data, i) && this.testSingleMovementDataRowForType(results.data, i)) {
                const m = this.createMovementPoint(results.data, i);
                movement.push(m); // always add to movement []
                // Test conversation data row for quality and if movement time is greater than conversationCounter time
                if (this.testConversationDataLengthAndRowForType(conversationCounter) && m.time >= conversationFileResults[conversationCounter][conversationHeaders[0]]) {
                    conversation.push(this.createConversationPoint(conversationCounter, m.xPos, m.yPos));
                    conversationCounter++;
                } else if (!this.testConversationDataLengthAndRowForType(conversationCounter)) conversationCounter++; // make sure to increment counter if bad data to skip row in next iteration of loop
            }
        }
        return [movement, conversation];
    }

    /**
     * Returns true if all values in provided row are of number type
     * @param  {Results [] from PapaParse} data
     * @param  {Integer} curRow
     */
    testSingleMovementDataRowForType(data, curRow) {
        return typeof data[curRow][movementHeaders[0]] === 'number' && typeof data[curRow][movementHeaders[1]] === 'number' && typeof data[curRow][movementHeaders[2]] === 'number';
    }

    /**
     * Method to sample data in two ways. Important to optimize user interaction and good curve drawing.
     * SampleRateDivisor determines if there is large or small amount of data
     * (1) If minimal amount of data, sample if curRow is greater than last row to 2 decimal places
     * (2) If large amount of data, sample if curRow is one whole number greater than last row
     * @param  {Results [] from PapaParse} data
     * @param  {Integer} curRow
     */
    testSampleMovementData(data, curRow) {
        if (curRow === 0 || curRow === 1) return true; // always return true for first two rows to set starting point
        const sampleRateDivisor = 5; // 5 as rate seems to work nicely on most devices
        if (Math.floor(data.length / sampleRateDivisor) < timelineLength) return Number.parseFloat(data[curRow][movementHeaders[0]]).toFixed(2) > Number.parseFloat(data[curRow - 1][movementHeaders[0]]).toFixed(2);
        else return Math.floor(data[curRow][movementHeaders[0]]) > Math.floor(data[curRow - 1][movementHeaders[0]]); // Large data sampling rate
    }

    createMovementPoint(data, curRow) {
        let m = new Point_Movement();
        m.time = data[curRow][movementHeaders[0]];
        m.xPos = data[curRow][movementHeaders[1]];
        m.yPos = data[curRow][movementHeaders[2]];
        return m;
    }

    /**
     * Creates and adds new Path object to global paths []
     * Also handles updating global totalTime and sorting paths []
     * @param  {Char} letterName
     * @param  {Point_Movement []} movement
     * @param  {Point_Conversation []} conversation
     */
    updatePaths(letterName, movement, conversation) {
        let p = new Path(letterName); // initialize with name and grey/black color
        p.movement = movement;
        p.conversation = conversation;
        if (dataIsLoaded(speakerList)) p.color = this.setPathColorBySpeaker(p.name); // if conversation file loaded, send to method to calculate color
        else p.color = colorList[paths.length % colorList.length]; // if no conversation file loaded path color is next in Color list
        paths.push(p);
        paths.sort((a, b) => (a.name > b.name) ? 1 : -1); // sort list so it appears nicely in GUI matching speakerlist array
        const curPathEndTime = Math.floor(movement[movement.length - 1].time);
        if (totalTimeInSeconds < curPathEndTime) totalTimeInSeconds = curPathEndTime; // update global total time, make sure to floor value as integer
    }

    /**
     * Returns color based on whether pathName has corresponding speaker
     * If path has corresponding speaker, color returned matches speaker
     * If it does not, color returned selects from global colorList based on num of speakers + numOfPaths that do not have corresponding speaker
     * 
     * @param  {} pathName
     */
    setPathColorBySpeaker(pathName) {
        if (speakerList.some(e => e.name === pathName)) {
            const hasSameName = (element) => element.name === pathName; // condition to satisfy/does it have pathName
            return speakerList[speakerList.findIndex(hasSameName)].color; // returns first index that satisfies condition/index of speaker that matches pathName
        } else return colorList[speakerList.length + this.getNumPathsWithNoSpeaker() % colorList.length]; // assign color to path
    }

    /**
     * Returns number of movement paths that do not have corresponding speaker
     */
    getNumPathsWithNoSpeaker() {
        let count = 0;
        for (let i = 0; i < paths.length; i++) {
            if (!speakerList.some(e => e.name === paths[i].name)) count++;
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
        c.time = conversationFileResults[index][conversationHeaders[0]];
        c.speaker = this.cleanSpeaker(conversationFileResults[index][conversationHeaders[1]]); // get cleaned speaker character
        c.talkTurn = conversationFileResults[index][conversationHeaders[2]];
        return c;
    }

    /**
     * Updates global speaker list from conversation file data/results
     */
    updateSpeakerList() {
        for (let i = 0; i < conversationFileResults.length; i++) {
            let tempSpeakerList = []; // create/populate temp list to store strings to test from global speakerList
            for (let j = 0; j < speakerList.length; j++) tempSpeakerList.push(speakerList[j].name);
            // If row is good data, test if speakerList already has speaker and if not add speaker 
            if (this.testConversationDataLengthAndRowForType(i)) {
                const speaker = this.cleanSpeaker(conversationFileResults[i][conversationHeaders[1]]); // get cleaned speaker character
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
     * Adds new speaker object with initial color to global speakerList from character
     * @param  {Char} speaker
     */
    addSpeakerToSpeakerList(name) {
        speakerList.push(new Speaker(name, colorList[speakerList.length % colorList.length]));
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

    // Tests if current conversation row is less than total rows in table and if time is number and speaker is string and talk turn is not null or undefined
    // NOTE: this also tests if a conversation file is loaded
    testConversationDataLengthAndRowForType(curRow) {
        return curRow < conversationFileResults.length && typeof conversationFileResults[curRow][conversationHeaders[0]] === 'number' && typeof conversationFileResults[curRow][conversationHeaders[1]] === 'string' && conversationFileResults[curRow][conversationHeaders[2]] != null;
    }
}