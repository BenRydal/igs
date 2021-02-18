// let myRequest = new Request('data/conversation.csv');
// fetch(myRequest).then(function (response) {
//     return response.arrayBuffer();
// }).then(function (buffer) {
//     fileTEST = new File([buffer], "foo.txt", {
//         type: "text/csv",
//     });
// });

function loadTIMMSExample() {
    loadImage('data/floorplan.png', img => {
        processFloorPlan(img);
    });
    //processConversationTEMP(loadTable('data/conversation.csv', "header"));
    conversationTable = loadTable('data/conversation.csv', "header"); // load conversation file first

    for (let i = 0; i < movementFileFirstLetters.length; i++) { // loop through all files in directory
        let fileName = 'data/' + movementFileFirstLetters[i];
        let dataTable = loadTable(fileName, "header");
        movementDataTables.push(dataTable);
    }
    processVideo('File', {
        fileName: 'data/video.mp4'
    });
}

// function loadTIMMSExample() {
//     loadImage('data/floorplan.png', img => {
//         processFloorPlan(img);
//     });

//     let requestConversationFile = new Request('data/conversation.csv');
//     fetch(requestConversationFile).then(function (response) {
//         return response.arrayBuffer();
//     }).then(function (buffer) {
//         conversationTable = new File([buffer], "conversation.csv", {
//             type: "text/csv",
//         });
//     });

//     for (let i = 0; i < movementFileFirstLetters.length; i++) { // loop through all files in directory
//         let myRequest = new Request('data/' + movementFileFirstLetters[i]);
//         fetch(myRequest).then(function (response) {
//             return response.arrayBuffer();
//         }).then(function (buffer) {
//             movementDataTables.push(new File([buffer], movementFileFirstLetters[i], {
//                 type: "text/csv",
//             }));
//         });
//     }

//     processVideo('File', {
//         fileName: 'data/video.mp4'
//     });
// }

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

function processData() {
    loadConversationDataTable();
    // load all movement files and pass first character of filename
    for (let i = 0; i < movementDataTables.length; i++) loadMovementDataTable(movementDataTables[i], movementFileFirstLetters[i].charAt(0), conversationTable);
    animationMaxValue = Math.min(...rowCounts); // set animationMaxVlaue to the smallest data file
}


// Test all rows in conversation file to populate global speakerList with speaker objects based on first character
function loadConversationDataTable() {
    for (let i = 0; i < conversationTable.getRowCount(); i++) {
        let tempSpeakerList = []; // create/populate temp list to store strings to test from global speakerList
        for (let j = 0; j < speakerList.length; j++) tempSpeakerList.push(speakerList[j].name);
        let speaker = conversationTable.getString(i, conversationHeaders[1]); // get speaker
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