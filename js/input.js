// if image: replace floor plan and rerun movement?????
function parseFloorPlanFile(input) {
  let file = input.files[0];
  let fileLocation = URL.createObjectURL(file);
  processFloorPlan(loadImage(fileLocation));
  // img.onload = function() {
  //   URL.revokeObjectURL(this.src);
  // }
}

// From image file, sets floor plan width/height to display and scale movement data
function processFloorPlan(img) {
  floorPlan = img;
  inputFloorPlanPixelWidth = floorPlan.width;
  inputFloorPlanPixelHeight = floorPlan.height;
}

// Parses all input selected movement files
function parseExampleMovementFile(input) {
  Papa.parse(input, {
    complete: testMovementFile,
    header: true,
  });
}

// Parses all input selected movement files
function parseInputMovementFile(input) {
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
  let conversationCounter = 0;
  for (let i = 0; i < results.data.length; i += dataSamplingRate) { // sampling rate reduces data size
    let m = new Point_Movement();
    m.time = map(results.data[i][movementHeaders[0]], 0, totalTimeInSeconds, timelineStart, timelineEnd); // map to timeline pixel values
    m.xPos = results.data[i][movementHeaders[1]] * displayFloorPlanWidth / inputFloorPlanPixelWidth; // scale to floor plan image file
    m.yPos = results.data[i][movementHeaders[2]] * displayFloorPlanHeight / inputFloorPlanPixelHeight;
    movement.push(m); // always add to movement
    // load conversation turn if first time vlaue of row >= to time of conversation turn and increment counter
    if (results.data[i][movementHeaders[0]] <= conversationFileResults[conversationCounter][conversationHeaders[0]]) continue;
    else {
      if (conversationCounter < conversationFileResults.length) {
        conversation.push(processConversation(conversationCounter, m.xPos, m.yPos));
        conversationCounter++; // increment counter for next comparison
      }
    }
  }
  let p = new Path(file.name.charAt(0), basePathColor); // initialize with name and grey/black color
  p.movement = movement;
  p.conversation = conversation;
  // If any speakerObjects have same name as path filename, make path same color
  for (let i = 0; i < speakerList.length; i++) {
    if (speakerList[i].name === file.name.charAt(0)) p.color = speakerList[i].color;
  }
  paths.push(p);
}

function processConversation(index, xPos, yPos) {
  let c = new Point_Conversation();
  c.xPos = xPos; // set to x/y pos in movement file case
  c.yPos = yPos;
  c.time = map(conversationFileResults[index][conversationHeaders[0]], 0, totalTimeInSeconds, timelineStart, timelineEnd);
  c.speaker = conversationFileResults[index][conversationHeaders[1]];
  c.talkTurn = conversationFileResults[index][conversationHeaders[2]];
  return c;
}

function parseConversationFile(input) {
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
  conversationFileResults = results.data; // set to new array of keyed values
  updateSpeakerList();
  // updateData = true;
  //}
}

// Test all rows in conversation file to populate global speakerList with speaker objects based on first character
function updateSpeakerList() {
  for (let i = 0; i < conversationFileResults.length; i++) {
    let tempSpeakerList = []; // create/populate temp list to store strings to test from global speakerList
    for (let j = 0; j < speakerList.length; j++) tempSpeakerList.push(speakerList[j].name);
    let speaker = conversationFileResults[i][conversationHeaders[1]]; // get speaker
    if (!tempSpeakerList.includes(speaker)) { // if not in list, add new Speaker Object to global speakerList
      let s = new Speaker(speaker, speakerColorList[speakerList.length % speakerColorList.length]);
      speakerList.push(s);
    }
  }
}

// parses inputted video files from user computer
function parseVideoFileInput(input) {
  movie.remove(); // remove exisiting movie element
  //ReRun data??
  let fileLocation = URL.createObjectURL(input);
  processVideo('File', {
    fileName: fileLocation
  });
}

// parses inputted video files from Youtube
function readYoutubeVideoInput(input) {
  movie.remove(); // remove exisiting movie element
  //ReRun data??
  let fileLocation = URL.createObjectURL(input);
  processVideo('Youtube', {
    videoId: input
  }); // process as video file
}

// Creates movie element specific to videoPlatform and params
function processVideo(videoPlatform, videoParams) {
  if (videoPlatform === 'File') movie = createVideo(videoParams['fileName']);
  else movie = createDiv(); // create the div that will hold the video
  movie.id('moviePlayer');
  movie.style('display', 'none');
  setupMovie('moviePlayer', videoPlatform, videoParams); // set up the video player
  // DO YOU NEED THIS, set in setup once? let video = select('#moviePlayer').position(timelineStart, 0); // position video in upper left corner on timeline
  // ReRunData?
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
}