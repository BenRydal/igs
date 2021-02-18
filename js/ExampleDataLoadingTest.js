// needs to be global floor plan image file and global video
// does NOT need to be global movement/convo table or file names???


let example_1 = ['data/floorplan.png', 'data/conversation.csv', ['Teacher.csv'], 'File', {
    fileName: 'data/video.mp4'
}];

// process funtion for example data
function processDataTemp() {
    //print(movementDataTables.length, movementFileFirstLetters.length, conversationTable.getRowCount());
    //print(conversationTable.getRowCount);
    loadConversationDataTable();
    // load all movement files and pass first character of filename
    for (let i = 0; i < movementDataTables.length; i++) loadMovementDataTable(movementDataTables[i], movementFileFirstLetters[i].charAt(0), conversationTable);
    animationMaxValue = Math.min(...rowCounts); // set animationMaxVlaue to the smallest data file
}

function loadExample(params) {
    loadImage(params[0], img => {
        processFloorPlan(img);
    });

    loadTable(params[1], "header", cTable => {
        conversationTable = cTable;
        loadMovementData(params[2]);

        loadConversationDataTable();
        // fill movement data tables and file letters
        for (let i = 0; i < params[2].length; i++) {
            movementDataTables.push(loadTable('data/' + params[2][i], "header"));
            movementFileFirstLetters.push(params[2][i].charAt(0));
        }
        //print(conversationTable.getRowCount());
    });

    processVideo(params[3], params[4]);
}

function loadMovementData(files, PROCESS) {
    for (let i = 0; i < files.length; i++) {
        loadTable('data/' + files[i], "header", mTable => {
            movementDataTables.push(mTable);
            movementFileFirstLetters.push(files[i].charAt(0));
        });
    }
}

// Test all rows in conversation file to populate global speakerList with speaker objects based on first character
function loadConversationDataTable() {
    conversationRowCount = conversationTable.getRowCount();
    for (let i = 0; i < conversationRowCount; i++) {
        let tempSpeakerList = []; // create/populate temp list to store strings to test from global speakerList
        for (let j = 0; j < speakerList.length; j++) tempSpeakerList.push(speakerList[j].name);
        let speaker = conversationTable.getString(i, conversationHeaders[1]); // get speaker
        if (!tempSpeakerList.includes(speaker)) { // if not in list, add new Speaker Object to global speakerList
            let s = new Speaker(speaker, speakerColorList[speakerList.length % speakerColorList.length]);
            speakerList.push(s);
        }
    }

}






// Creates movie element specific to videoPlatform and params
function processVideo(videoPlatform, videoParams) {
    if (videoPlatform === 'File') movie = createVideo(videoParams['fileName']);
    else movie = createDiv(); // create the div that will hold the video
    movie.id('moviePlayer');
    movie.style('display', 'none');
    setupMovie('moviePlayer', videoPlatform, videoParams); // set up the video player
}

// From image file, sets floor plan width/height to display and scale movement data
function processFloorPlan(img) {
    floorPlan = img;
    inputFloorPlanPixelWidth = floorPlan.width;
    inputFloorPlanPixelHeight = floorPlan.height;
}

function processConversationTable(table) {
    conversationRowCount = table.getRowCount();
    for (let i = 0; i < conversationRowCount; i++) {
        let tempSpeakerList = []; // create/populate temp list to store strings to test from global speakerList
        for (let j = 0; j < speakerList.length; j++) tempSpeakerList.push(speakerList[j].name);
        let speaker = table.getString(i, conversationHeaders[1]); // get speaker
        if (!tempSpeakerList.includes(speaker)) { // if not in list, add new Speaker Object to global speakerList
            let s = new Speaker(speaker, speakerColorList[speakerList.length % speakerColorList.length]);
            speakerList.push(s);
        }
    }
}

//
function loadMovementDataTable(dataMovement, dataMovementShortName) {
    let movement = []; // holds location data for each path
    let conversation = []; // holds conversaton data and location data for conversation for each path
    let rowCountMovement = dataMovement.getRowCount();
    rowCounts.push(rowCountMovement / dataSamplingRate); // add number of data points to rowCounts list to set animation
    let convoRowCounter = 0;
    // increment by sampling rate to reduce data
    for (let i = 0; i < rowCountMovement; i += dataSamplingRate) {
        let m = new Point_Movement();
        m.xPos = dataMovement.getNum(i, movementHeaders[1]) * displayFloorPlanWidth / inputFloorPlanPixelWidth; // scale factors to fit screen correctly
        m.yPos = dataMovement.getNum(i, movementHeaders[2]) * displayFloorPlanHeight / inputFloorPlanPixelHeight;
        m.time = map(dataMovement.getNum(i, movementHeaders[0]), 0, totalTimeInSeconds, timelineStart, timelineEnd); // map time to timeline pixel values for use later in program
        movement.push(m); // always add to movement

        // Get conversation turn if movement case is first case >= to conversation case, increment counter if so
        if (dataMovement.getNum(i, movementHeaders[0]) < conversationTable.getNum(convoRowCounter, conversationHeaders[0])) continue;
        else {
            if (convoRowCounter < conversationTable.getRowCount() - 1) { // ADD ADDITIONAL TESTS??
                let c = new Point_Conversation();
                c.xPos = m.xPos; // set to x/y pos in movement file case
                c.yPos = m.yPos;
                c.time = map(conversationTable.getNum(convoRowCounter, conversationHeaders[0]), 0, totalTimeInSeconds, timelineStart, timelineEnd);
                c.speaker = conversationTable.getString(convoRowCounter, conversationHeaders[1]);
                c.talkTurn = conversationTable.getString(convoRowCounter, conversationHeaders[2]);
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
    let video = select('#moviePlayer').position(timelineStart, 0); // position video in upper left corner on timeline
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
        case "File":
            videoPlayer = new FilePlayer(params);
            break;
    }
}

function processData() {
    loadConversationDataTable();
    // load all movement files and pass first character of filename
    for (let i = 0; i < dataTables.length; i++) loadMovementDataTable(dataTables[i], movementFiles[i].charAt(0), conversationTable);
    animationMaxValue = Math.min(...rowCounts); // set animationMaxVlaue to the smallest data file
}

