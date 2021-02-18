// Parses all input selected movement files
function parseInputMovementFiles(input) {
    for (let i = 0; i < input.files.length; i++) {
        let file = input.files[i];
        Papa.parse(file, {
            complete: testMovementFile,
            header: true,
        });
    }
}

// Tests movement file formatting
function testMovementFile(results, file) {
    console.log("Parsing complete:", results, file);
    //if (testMovementHeaders(results.data, results.meta.fields)) processMovementFile(results);
    processMovementFile(results, file);
    // if first file, clearData(); // clear exisiting data
    // if last file, processData();
}

// Processes array of movement data
function processMovementFile(results, file) {
    let movement = []; // holds movement points (location data)
    let conversation = []; // holds conversaton points (text and location data for conversation)
    let rCount = results.data.length;
    rowCounts.push(rCount / dataSamplingRate); // important for animation
    let conversationCounter = 0;
    for (let i = 0; i < rCount; i += dataSamplingRate) { // sampling rate reduces data size
        let m = new Point_Movement();
        m.time = map(results.data[i][movementHeaders[0]], 0, totalTimeInSeconds, timelineStart, timelineEnd); // map to timeline pixel values
        m.xPos = results.data[i][movementHeaders[1]] * displayFloorPlanWidth / inputFloorPlanPixelWidth; // scale to floor plan image file
        m.yPos = results.data[i][movementHeaders[2]] * displayFloorPlanHeight / inputFloorPlanPixelHeight;
        movement.push(m); // always add to movement
        // load conversation turn if first time vlaue of row >= to time of conversation turn and increment counter
        if (results.data[i][movementHeaders[0]] < conversationTable[convoRowCounter][conversationHeaders[0]]) continue;
        else if (convoRowCounter < conversationTable.length) {
            conversation.push(processConversation(convoRowCounter, m.xPos, m.yPos));
            conversationCounter++; // increment counter for next comparison
        }
    }
    let p = new Path(file.name.charAt(0), basePathColor); // initialize with name and grey/black color
    p.movement = movement;
    p.conversation = conversation;
    // If any speakerObjects have same name as path filename, make path same color
    for (let i = 0; i < speakerList.length; i++) {
        if (speakerList[i].name === dataMovementShortName) p.color = speakerList[i].color;
    }
    paths.push(p);
}

function processConversationFile(index, xPos, yPos) {
    let c = new Point_Conversation();
    c.xPos = xPos; // set to x/y pos in movement file case
    c.yPos = yPos;
    c.time = map(conversationTable[index][conversationHeaders[0]], 0, totalTimeInSeconds, timelineStart, timelineEnd);
    c.speaker = conversationTable[index][conversationHeaders[1]];
    c.talkTurn = conversationTable[index][conversationHeaders[2]];
    return c;
}


function parseInputConversationFile(input) {
    let file = input.files[0];
    Papa.parse(file, {
        complete: testConversationFile,
        header: true,
    });
    // if (updateData) processData();
}

function parseExampleConversationFile(input) {
    Papa.parse(input, {
        complete: testConversationFile,
        header: true,
    });
}

function testConversationFile(results, file) {
    console.log("Parsing complete:", results, file);
    //if (testConversationHeaders(results.data, results.meta.fields)) {
    // if no errors
    //clear exisiting
    conversationTable = results.data; // set to new array of keyed values
    updateSpeakerList();
    // updateData = true;
    //}
}

// Sets global speakerList objects based on coversation File
function updateSpeakerList() {
    for (let i = 0; i < conversationTable.length; i++) {
        let speaker = conversationTable[i][conversationHeaders[1]]; // get speaker
        if (!speakerList.includes(speaker)) { // if not in list, add new Speaker Object to global speakerList
            let s = new Speaker(speaker, speakerColorList[speakerList.length % speakerColorList.length]);
            speakerList.push(s);
        }
    }
}

// if image: replace floor plan and rerun movement?????
function readImageFile(input) {
    let file = input.files[0];
    let fileLocation = URL.createObjectURL(file);
    processFloorPlan(loadImage(fileLocation));
    // img.onload = function() {
    //   URL.revokeObjectURL(this.src);
    // }
    processData();
  }
  
  // Video File Button Reader (could have YouTube/others)
  function readVideoFile(input) {
    let file = input.files[0];
    let fileLocation = URL.createObjectURL(file);
    movie.remove();
    movie = createVideo(fileLocation);
    movie.id('moviePlayer');
    movie.style('display', 'none');
    setupMovie('moviePlayer', 'File', {
      fileName: fileLocation
    });
    let video = select('#moviePlayer').position(timelineStart, 0); // position video in upper left corner on timeline
    processData();
  }
  
  function testMovementHeaders(data, meta) {
    return data > 0 && meta.includes(movementHeaders[0]) && meta.includes(movementHeaders[1]) && meta.includes(movementHeaders[2]);
  }
  
  function testConversationHeaders(data, meta) {
    return data > 0 && meta.includes(conversationHeaders[0]) && meta.includes(conversationHeaders[1]) && meta.includes(conversationHeaders[2]);
  }
  
  function clearData() {
    paths = [];
    speakerList = [];
    movementDataTables = [];
    rowCounts = [];
  }
  
  // // YOUTUBE BUTTON VIDEO READER??
  // function readVideoFile(input) {
  //   let file = input.files[0];
  //   let fileLocation = URL.createObjectURL(file);
  //   movie.remove();
  
  //   let videoPlatform = 'File';
  //   let videoParams = {
  //     fileName: fileLocation
  //   };
  
  //   if (videoPlatform === 'File') movie = createVideo(fileLocation);
  //   else movie = createDiv(); // create the div that will hold the video
  //   movie.id('moviePlayer');
  //   movie.style('display', 'none');
  //   setupMovie('moviePlayer', videoPlatform, videoParams); // set up the video player
  //   let video = select('#moviePlayer').position(timelineStart, 0); // position video in upper left corner on timeline
  //   // RERUN DATA
  // }