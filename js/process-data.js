/**
 * Creates P5 image file from path
 * Updates global floorPlan image and input width/heights of floorPlan to properly scale and display data
 * @param  {String} filePath
 */
function processFloorPlan(filePath) {
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
 * Tests and samples array of movement data to add to Path Object
 * Also tests conversation data to closest time value in movement data to add to Path object
 * @param  {Results [] from PapaParse} results
 */
function processMovementFile(results) {
    let movement = []; // Array to hold Point_Movement objects
    let conversation = []; // Array to hold Point_Conversation
    let conversationCounter = 0;
    for (let i = 0; i < results.data.length; i++) {
        // Sample movement row and test if row is good data
        if (testSampleMovementData(results.data, i) && testMovementDataRowForType(results.data, i)) {
            const m = createMovementPoint(results.data, i);
            movement.push(m); // always add to movement []
            if (testConversationDataLengthAndRowForType(conversationCounter) && m.time >= conversationFileResults[conversationCounter][conversationHeaders[0]]) {
                conversation.push(createConversationPoint(conversationCounter, m.xPos, m.yPos));
                conversationCounter++;
            } else if (!testConversationDataLengthAndRowForType(conversationCounter)) conversationCounter++;
        }
    }
    return [movement, conversation];
}

function createMovementPoint(data, curRow) {
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
function updatePaths(letterName, movement, conversation) {
    let p = new Path(letterName); // initialize with name and grey/black color
    p.movement = movement;
    p.conversation = conversation;
    if (dataIsLoaded(speakerList)) p.color = setPathColorBySpeaker(p.name); // if conversation file loaded, send to method to calculate color
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
function setPathColorBySpeaker(pathName) {
    if (speakerList.some(e => e.name === pathName)) {
        const hasSameName = (element) => element.name === pathName; // condition to satisfy/does it have pathName
        return speakerList[speakerList.findIndex(hasSameName)].color; // returns first index that satisfies condition/index of speaker that matches pathName
    } else return colorList[speakerList.length + getNumPathsWithNoSpeaker() % colorList.length]; // assign color to path
}

/**
 * Returns number of movement paths that do not have corresponding speaker
 */
function getNumPathsWithNoSpeaker() {
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
function createConversationPoint(index, xPos, yPos) {
    let c = new Point_Conversation();
    c.xPos = xPos; // set to x/y pos in movement file case
    c.yPos = yPos;
    c.time = conversationFileResults[index][conversationHeaders[0]];
    c.speaker = cleanSpeaker(conversationFileResults[index][conversationHeaders[1]]); // get cleaned speaker character
    c.talkTurn = conversationFileResults[index][conversationHeaders[2]];
    return c;
}

/**
 * Updates global speaker list from conversation file data/results
 */
function updateSpeakerList() {
    for (let i = 0; i < conversationFileResults.length; i++) {
        let tempSpeakerList = []; // create/populate temp list to store strings to test from global speakerList
        for (let j = 0; j < speakerList.length; j++) tempSpeakerList.push(speakerList[j].name);
        // If row is good data, test if speakerList already has speaker and if not add speaker 
        if (testConversationDataLengthAndRowForType(i)) {
            const speaker = cleanSpeaker(conversationFileResults[i][conversationHeaders[1]]); // get cleaned speaker character
            if (!tempSpeakerList.includes(speaker)) addSpeakerToSpeakerList(speaker);
        }
    }
}
/**
 * From String, trims white space, converts to uppercase and returns sub string of 2 characters
 * @param  {String} s
 */
function cleanSpeaker(s) {
    return s.trim().toUpperCase().substring(0, 2);
}

/**
 * Adds new speaker object with initial color to global speakerList from character
 * @param  {Char} speaker
 */
function addSpeakerToSpeakerList(name) {
    speakerList.push(new Speaker(name, colorList[speakerList.length % colorList.length]));
}

// Initialization for the video player
function processVideo(platform, params) {
    noLoop(); // currently loop continued in videoPlayer API
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

// Returns true if all values are number type
function testMovementDataRowForType(data, curRow) {
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
function testSampleMovementData(data, curRow) {
    if (curRow === 0 || curRow === 1) return true; // always return true for first two rows to set starting point
    const sampleRateDivisor = 5; // 5 as rate seems to work nicely on most devices
    if (Math.floor(data.length / sampleRateDivisor) < timelineLength) return Number.parseFloat(data[curRow][movementHeaders[0]]).toFixed(2) > Number.parseFloat(data[curRow - 1][movementHeaders[0]]).toFixed(2);
    else return Math.floor(data[curRow][movementHeaders[0]]) > Math.floor(data[curRow - 1][movementHeaders[0]]); // Large data sampling rate
}

// Tests if current conversation row is less than total rows in table and if time is number and speaker is string and talk turn is not null or undefined
// NOTE: this also tests if a conversation file is loaded
function testConversationDataLengthAndRowForType(curRow) {
    return curRow < conversationFileResults.length && typeof conversationFileResults[curRow][conversationHeaders[0]] === 'number' && typeof conversationFileResults[curRow][conversationHeaders[1]] === 'string' && conversationFileResults[curRow][conversationHeaders[2]] != null;
}