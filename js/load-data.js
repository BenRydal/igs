function setData() {
    setGUI();
    processData();
    animationMaxValue = Math.min(...rowCounts); // set animationMaxVlaue to the smallest data file
}

function setGUI() {
    setBaseValues();
    setTextSizes();
    setConversationValues();
    setVideoValues();
}

function setBaseValues() {
    timelineStart = width * 0.4638;
    timelineEnd = width * 0.9638;
    timelineLength = timelineEnd - timelineStart;
    timelineHeight = height * .81;
    displayFloorPlanWidth = timelineStart - (width - timelineEnd);
    displayFloorPlanHeight = timelineHeight;
    currPixelTimeMin = timelineStart; // adjustable timeline values
    currPixelTimeMax = timelineEnd;
    yPosTimeScaleTop = timelineHeight - tickHeight;
    yPosTimeScaleBottom = timelineHeight + tickHeight;
    yPosTimeScaleSize = 2 * tickHeight;
    buttonSpacing = width / 71;
    buttonWidth = buttonSpacing;
    speakerKeysHeight = timelineHeight + (height - timelineHeight) / 4;
    buttonsHeight = timelineHeight + (height - timelineHeight) / 1.8;
    bugPrecision = 3;
    bugSize = width / 56;
}

function setTextSizes() {
    keyTextSize = width / 70;
    titleTextSize = width / 55;
    infoTextSize = width / 100;
}

function setConversationValues() {
    textBoxWidth = width / 3.5; // width of text and textbox drawn
    textSpacing = width / 57; // textbox leading
    boxSpacing = width / 141; // general textBox spacing variable
    boxDistFromRect = width / 28.2; // distance from text rectangle of textbox
}

function setVideoValues() {
    var video = select('#moviePlayer').position(timelineStart, 0); // position video in upper left corner on timeline
    videoWidthOnPause = width / 5;
    videoHeightOnPause = width / 6;
    videoWidthOnPlay = width - timelineStart;
    videoHeightOnPlay = height * .74;
    videoWidthPlayCounter = videoWidthOnPause;
    videoHeightPlayCounter = videoHeightOnPause;
}

// Initialization for the video player
function setupMovie(movieDiv, platform, params) {
    params['targetId'] = movieDiv; // regardless of platform, the videoPlayer needs a target div
    // Based on the specified platform, chose the appropriate type of videoPlayer to use
    switch (platform) {
        case "Kaltura":
            videoPlayer = new KalturaPlayer(params);
            break;
        case "Youtube":
            videoPlayer = new YoutubePlayer(params);
            break;
    }
}

function processData() {
    loadConversationDataTable(conversationTable);
    // load all movement files and pass first character of filename
    for (let i = 0; i < dataTables.length; i++) loadMovementDataTable(dataTables[i], movementFiles[i].charAt(0), conversationTable);
}

// Test all rows in conversation file to populate global speakerList with speaker objects based on first character
function loadConversationDataTable(dataConversation) {
    conversationTableRowCount = dataConversation.getRowCount();
    turnCountPerSecond = conversationTableRowCount / totalTimeInSeconds;
    for (let i = 0; i < conversationTableRowCount; i++) {
        let tempSpeakerList = []; // create/populate temp list to store strings to test from global speakerList
        for (let j = 0; j < speakerList.length; j++) tempSpeakerList.push(speakerList[j].name);
        let speaker = dataConversation.getString(i, convoColumnHeaders[1]); // get speaker
        if (!tempSpeakerList.includes(speaker)) { // if not in list, add new Speaker Object to global speakerList
            let s = new Speaker(speaker, speakerColorList[speakerList.length % speakerColorList.length]);
            speakerList.push(s);
        }
    }
}

//
function loadMovementDataTable(dataMovement, dataMovementShortName, dataConversation) {
    let movement = []; // holds location data for each path
    let conversation = []; // holds conversaton data and location data for conversation for each path
    let rowCountMovement = dataMovement.getRowCount();
    let rowCountConversation = dataConversation.getRowCount();
    rowCounts.push(rowCountMovement / dataSamplingRate); // add number of data points to rowCounts list to set animation
    let convoRowCounter = 0;
    // increment by sampling rate to reduce data
    for (let i = 0; i < rowCountMovement; i += dataSamplingRate) {
        let m = new Point_Movement();
        m.xPos = dataMovement.getNum(i, mvmentColumnHeaders[1]) * displayFloorPlanWidth / inputFloorPlanPixelWidth; // scale factors to fit screen correctly
        m.yPos = dataMovement.getNum(i, mvmentColumnHeaders[2]) * displayFloorPlanHeight / inputFloorPlanPixelHeight;
        m.time = map(dataMovement.getNum(i, mvmentColumnHeaders[0]), 0, totalTimeInSeconds, timelineStart, timelineEnd); // map time to timeline pixel values for use later in program
        movement.push(m); // always add to movement

        // Get conversation turn if movement case is first case >= to conversation case, increment counter if so
        if (dataMovement.getNum(i, mvmentColumnHeaders[0]) < dataConversation.getNum(convoRowCounter, convoColumnHeaders[0])) continue;
        else {
            if (convoRowCounter < rowCountConversation - 1) { // ADD ADDITIONAL TESTS??
                let c = new Point_Conversation();
                c.xPos = m.xPos; // set to x/y pos in movement file case
                c.yPos = m.yPos;
                c.time = map(dataConversation.getNum(convoRowCounter, convoColumnHeaders[0]), 0, totalTimeInSeconds, timelineStart, timelineEnd);
                c.speaker = dataConversation.getString(convoRowCounter, convoColumnHeaders[1]);
                c.talkTurn = dataConversation.getString(convoRowCounter, convoColumnHeaders[2]);
                conversation.push(c);
                convoRowCounter++; // increment counter for next comparison
            }
        }
    }
    let p = new Path(dataMovementShortName, basePathColor); // initialize with name and grey/black color
    p.movement = movement;
    p.conversation = conversation;
    // If any speakerObjects have same name as path filename, make path same color
    for (let i = 0; i < speakerList.length; i++) {
        if (speakerList[i].name === dataMovementShortName) p.color = speakerList[i].color;
    }
    paths.push(p);
}