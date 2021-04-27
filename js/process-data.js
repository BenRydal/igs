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
    });
}

/**
 * Tests and samples array of movement data to add to Path Object
 * Also tests conversation data to closest time value in movement data to add to Path object
 * @param  {Results [] from PapaParse} results
 * @param  {File} file
 */
function processMovementFile(results, file) {
    let movement = []; // Array to hold Point_Movement objects
    let conversation = []; // Array to hold Point_Conversation
    let conversationCounter = 0;
    for (let i = 0; i < results.data.length; i++) {
        // sample and test data
        if (testSampleMovementData(results.data, i) && testMovementDataRowForType(results.data[i][movementHeaders[0]], results.data[i][movementHeaders[1]], results.data[i][movementHeaders[2]])) {
            let m = new Point_Movement();
            m.time = results.data[i][movementHeaders[0]];
            m.xPos = results.data[i][movementHeaders[1]];
            m.yPos = results.data[i][movementHeaders[2]];
            movement.push(m); // always add to movement []
            // Test conversation is good data and movement time larger than conversation time at curCounter
            // If both true, load process conversation data for that row and increment counter for next comparison
            if (testConversationDataRow(conversationCounter) && testMovementLargerThanConversationTime(m.time, conversationFileResults[conversationCounter][conversationHeaders[0]])) {
                conversation.push(processConversation(conversationCounter, m.xPos, m.yPos));
                conversationCounter++;
            }
        }
    }
    updatePaths(file.name.charAt(0), movement, conversation);
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
    if (speakerList === undefined) p.color = colorList[paths.length % colorList.length]; // if no conversation file loaded path color is next in Color list
    else p.color = setPathColorBySpeaker(p.name); // if conversation file loaded, send to method to calculate color
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
 * @param  {} xPos
 * @param  {} yPos
 */
function processConversation(index, xPos, yPos) {
    let c = new Point_Conversation();
    c.xPos = xPos; // set to x/y pos in movement file case
    c.yPos = yPos;
    c.time = conversationFileResults[index][conversationHeaders[0]];
    c.speaker = conversationFileResults[index][conversationHeaders[1]];
    c.talkTurn = conversationFileResults[index][conversationHeaders[2]];
    return c;
}

// Test all rows in conversation file to populate global speakerList with speaker objects based on first character
function updateSpeakerList() {
    for (let i = 0; i < conversationFileResults.length; i++) {
        let tempSpeakerList = []; // create/populate temp list to store strings to test from global speakerList
        for (let j = 0; j < speakerList.length; j++) tempSpeakerList.push(speakerList[j].name);
        let speaker = conversationFileResults[i][conversationHeaders[1]]; // get speaker
        // if row has all good data and speaker is not in list yet, add new Speaker Object to global speakerList
        if (testConversationDataRow(i) && !tempSpeakerList.includes(speaker)) {
            let s = new Speaker(speaker, colorList[speakerList.length % colorList.length]); // instantiate new speaker with name and color
            speakerList.push(s);
        }
    }
}

// Initialization for the video player
function processVideo(platform, params) {
    noLoop(); // currently loop continued in videoPlayer API
    if (videoPlayer !== undefined) videoPlayer.destroy();
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
function testMovementDataRowForType(time, x, y) {
    return typeof time === 'number' && typeof x === 'number' && typeof y === 'number';
}

/**
 * Method with conditionals that compare current to prior row to sample data
 * Currently, if the number of rows in data is less than five times the pixel length of the timeline
 * then current row/data case must be greater by 1 decimal point than previous row. Otherwise, floored/integer
 * value of current row must be great than floored/integer value of prior row--this equates to 1 second greater
 * NOTE: always return true on first two rows to set starting points for data
 * NOTE: can be updated but this method necessary to optimize user interaction and good curve drawing
 * 
 * 
 * @param  {Results [] from PapaParse} data
 * @param  {Integer} curRow
 */
function testSampleMovementData(data, curRow) {
    if (curRow === 0 || curRow === 1) return true; // always return true for first two rows to set starting point
    const sampleRateDivisor = 5; // 5 as rate seems to work best on most devices
    if (data.length / sampleRateDivisor < timelineLength) return Number.parseFloat(data[curRow][movementHeaders[0]]).toFixed(2) > Number.parseFloat(data[curRow - 1][movementHeaders[0]]).toFixed(2);
    else return Math.floor(data[curRow][movementHeaders[0]]) > Math.floor(data[curRow - 1][movementHeaders[0]]); // if there are more data cases than pixels on timeline, sample based on integer floored values/every second
}

// Tests if current conversation row is less than total rows in table and if time is number and speaker is string and talk turn is not null or undefined
// NOTE: this also tests if a conversation file is loaded
function testConversationDataRow(curRow) {
    return curRow < conversationFileResults.length && typeof conversationFileResults[curRow][conversationHeaders[0]] === 'number' && typeof conversationFileResults[curRow][conversationHeaders[1]] === 'string' && conversationFileResults[curRow][conversationHeaders[2]] !== null && conversationFileResults[curRow][conversationHeaders[2]] !== undefined;
}

function testMovementLargerThanConversationTime(movementTime, conversationTime) {
    return movementTime >= conversationTime;
}