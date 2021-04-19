function loadFonts() {
  font_PlayfairReg = loadFont("data/fonts/PlayfairDisplay-Regular.ttf");
  font_PlayfairItalic = loadFont("data/fonts/PlayfairDisplay-Italic.ttf");
  font_Lato = loadFont("data/fonts/Lato-Light.ttf");
}

function loadExampleDataSet() {
  let exampleSet = document.getElementById("examples").value;
  switch (exampleSet) {
    case "Example 1":
      loadExample(example_1);
      break;
    case "Example 2":
      loadExample(example_2);
      allConversation = false; // not necessary, but fits example nicely
      break;
    case "Example 3":
      loadExample(example_3);
      allConversation = false; // not necessary, but fits example nicely
      break;
    case "Example 4":
      loadExample(example_4);
      allConversation = false; // not necessary, but fits example nicely
      break;
  }
}

function loadExample(params) {
  processVideo(params[4], params[5]);
  loadImage(params[0] + params[1], img => {
    processFloorPlan(img);
  });
  // Async loading and processing of conversation file
  getExampleConversationFile(params[0], params[2]).then(parseConversationFile).catch(alert);
  // Async loading and processing of movement files
  getExampleMovementFiles(params[0], params[3]).then(parseMovementFiles).catch(alert);
}

/**
 * Handles async loading of conversation file
 * NOTE: folder and filename are separated for convenience later in program
 * @param  {} folder
 * @param  {} fileName
 */
async function getExampleConversationFile(folder, fileName) {
  let response = await fetch(new Request(folder + fileName));
  let buffer = await response.arrayBuffer();
  return new File([buffer], fileName, {
    type: "text/csv",
  });
}

async function getExampleMovementFiles(folder, fileNames) {
  let fileList = [];
  for (let i = 0; i < fileNames.length; i++) {
    let response = await fetch(new Request(folder + fileNames[i]));
    let buffer = await response.arrayBuffer();
    fileList.push(new File([buffer], fileNames[i], {
      type: "text/csv",
    }));
  }
  return fileList;
}

// Uploads floor plan image file and sends to update global floor plan image vars
function parseInputFloorPlanFile(input) {
  let file = input.files[0];
  input.value = ''; // reset input value so you can load same file again in browser
  let fileLocation = URL.createObjectURL(file);
  loadImage(fileLocation, img => {
    processFloorPlan(img);
    img.onload = function () {
      URL.revokeObjectURL(this.src);
    }
  });
}

// From image file, sets floor plan width/height to display and scale movement data
function processFloorPlan(img) {
  floorPlan = img;
  inputFloorPlanPixelWidth = floorPlan.width;
  inputFloorPlanPixelHeight = floorPlan.height;
}

/**
 * Converts and sends user inputted movement files into fileList for processing
 * @param  {} input
 */
function parseInputMovementFiles(input) {
  let fileList = [];
  for (let i = 0; i < input.files.length; i++) fileList.push(input.files[i]);
  parseMovementFiles(fileList);
  input.value = ''; // reset input value so you can load same file(s) again in browser
}
/**
 * Parses each movement file and sends for additional testing and processing
 * NOTE: boolean updateMovementData sets true to trigger clearing of current movement file data
 * @param  {} fileList
 */
function parseMovementFiles(fileList) {
  updateMovementData = true; // trigger movement to reprocess, reset later
  for (let i = 0; i < fileList.length; i++) {
    Papa.parse(fileList[i], {
      complete: testMovementFile,
      header: true,
      dynamicTyping: true,
    });
  }
}

// Tests movement file formatting
function testMovementFile(results, file) {
  console.log("Parsing complete:", results, file);
  if (testMovementFileData(results.data, results.meta.fields)) {
    if (updateMovementData) clearDataMovementFileInput(); // clear data if first accepted file
    movementFiles.push([results, file]);
    processMovementFile(results, file);
  }
}

// Processes movement file in relation to conversation file data and adds both to path object
function processMovementFile(results, file) {
  let movement = []; // holds movement points (location data)
  let conversation = []; // holds conversaton points (text and location data for conversation)
  let conversationCounter = 0;
  for (let i = 0; i < results.data.length; i++) {
    // sample data and test to make sure row is good data
    if (testSampleMovementData(results.data, i) && testMovementDataRowForType(results.data[i][movementHeaders[0]], results.data[i][movementHeaders[1]], results.data[i][movementHeaders[2]])) {
      let m = new Point_Movement();
      m.time = results.data[i][movementHeaders[0]];
      m.xPos = results.data[i][movementHeaders[1]];
      m.yPos = results.data[i][movementHeaders[2]];
      movement.push(m); // always add to movement
      // Test to make sure good data
      if (testConversationDataRow(conversationCounter)) {
        // load conversation turn and increment counter if movement time is larger than time in conversationFile results at curCounter
        if (m.time >= conversationFileResults[conversationCounter][conversationHeaders[0]]) {
          conversation.push(processConversation(conversationCounter, m.xPos, m.yPos));
          conversationCounter++; // increment counter for next comparison
        }
      }
    }
  }
  let p = new Path(file.name.charAt(0), basePathColor); // initialize with name and grey/black color
  p.movement = movement;
  p.conversation = conversation;
  // Update global total time, make sure to cast/floor values as integers
  if (totalTimeInSeconds < Math.floor(movement[movement.length - 1].time)) totalTimeInSeconds = Math.floor(movement[movement.length - 1].time);
  // If any speakerObjects have same name as path filename, make path same color
  for (let i = 0; i < speakerList.length; i++) {
    if (speakerList[i].name === file.name.charAt(0)) p.color = speakerList[i].color;
  }
  paths.push(p);
  // sort after every file loaded
  paths.sort((a, b) => (a.name > b.name) ? 1 : -1); // sort list so it appears nicely in GUI matching speakerlist array
}

function processConversation(index, xPos, yPos) {
  let c = new Point_Conversation();
  c.xPos = xPos; // set to x/y pos in movement file case
  c.yPos = yPos;
  c.time = conversationFileResults[index][conversationHeaders[0]];
  c.speaker = conversationFileResults[index][conversationHeaders[1]];
  c.talkTurn = conversationFileResults[index][conversationHeaders[2]];
  return c;
}

/**
 * Gets single file format from input and sends for conversation parsing
 * @param  {} input
 */
function parseInputConversationFile(input) {
  parseConversationFile(input.files[0]); // parse converted file
  input.value = ''; // reset input value so you can load same file again in browser
}

/**
 * Parses single conversation file using Papa.parse library
 * NOTE: testConversationFile is called when parsing is complete
 * @param  {} file
 */
function parseConversationFile(file) {
  Papa.parse(file, {
    complete: testConversationFile,
    header: true,
    dynamicTyping: true,
  });
}

function testConversationFile(results, file) {
  console.log("Parsing complete:", results, file);
  if (testConversationFileData(results.data, results.meta.fields)) {
    clearDataConversationFileInput();
    conversationFileResults = results.data; // set to new array of keyed values
    updateSpeakerList();
    // Must reprocess movement files
    for (let i = 0; i < movementFiles.length; i++) processMovementFile(movementFiles[i][0], movementFiles[i][1]);
  }
}

// Test all rows in conversation file to populate global speakerList with speaker objects based on first character
function updateSpeakerList() {
  for (let i = 0; i < conversationFileResults.length; i++) {
    let tempSpeakerList = []; // create/populate temp list to store strings to test from global speakerList
    for (let j = 0; j < speakerList.length; j++) tempSpeakerList.push(speakerList[j].name);
    let speaker = conversationFileResults[i][conversationHeaders[1]]; // get speaker
    // if row has all good data and speaker is not in list yet, add new Speaker Object to global speakerList
    if (testConversationDataRow(i) && !tempSpeakerList.includes(speaker)) {
      let s = new Speaker(speaker, speakerColorList[speakerList.length % speakerColorList.length]);
      speakerList.push(s);
    }
  }
  speakerList.sort((a, b) => (a.name > b.name) ? 1 : -1); // sort list so it appears nicely in GUI matching paths array
}

// parses inputted video files from user computer
function parseInputVideoFile(input) {
  if (videoIsShowing) overVideoButton(); // Turn off video that if showing
  let file = input.files[0];
  input.value = ''; // reset input value so you can load same file again in browser
  let fileLocation = URL.createObjectURL(file);
  processVideo('File', {
    fileName: fileLocation
  });
}

// Creates movie element specific to videoPlatform and params
function processVideo(videoPlatform, videoParams) {
  noLoop(); // stop program loop while loading video, restarted upon video loaded in videoPlayer or in processVideoFile if loading from file
  // if first time player loaded at program start it will be undefined, don't destroy exisiting player and remove exisiting movie element
  if (videoPlayer !== undefined) {
    videoPlayer.destroy();
    movie.remove();
  }
  if (videoPlatform === 'File') processVideoFromFile(videoPlatform, videoParams);
  else processVideoFromWeb(videoPlatform, videoParams);
}

// Creates movie element from file, use callback to make sure video loaded before setting player and starting loop again
function processVideoFromFile(videoPlatform, videoParams) {
  movie = createVideo(videoParams['fileName'], function () {
    movie.id('moviePlayer');
    movie.hide();
    setupMovie('moviePlayer', videoPlatform, videoParams); // set up the video player
    let video = select('#moviePlayer').position(timelineStart, 0); // position video in upper left corner on timeline
    movie.onload = function () {
      URL.revokeObjectURL(this.src);
    }
    loop(); // restart program loop (for other video platforms this is done in videoPlayer)
  });
}

function processVideoFromWeb(videoPlatform, videoParams) {
  movie = createDiv(); // create the div that will hold the video if other player
  movie.id('moviePlayer');
  movie.hide();
  setupMovie('moviePlayer', videoPlatform, videoParams); // set up the video player
  let video = select('#moviePlayer').position(timelineStart, 0); // position video in upper left corner on timeline
}

// Initialization for the video player
function setupMovie(movieDiv, platform, params) {
  params['targetId'] = movieDiv; // regardless of platform, the videoPlayer needs a target div
  // Based on the specified platform, chose the appropriate type of videoPlayer to use
  // ADD TRY/CATCH HERE?
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

function clearDataConversationFileInput() {
  speakerList = [];
  paths = [];
}

function clearDataMovementFileInput() {
  movementFiles = [];
  paths = [];
  totalTimeInSeconds = 0; // reset total time
  updateMovementData = false; // reset
}

// ***** MOVEMENT FILE TESTS *****
// Test if there is data in file, if it has correct movement file headers, and if at leasat one row of values is of correct type for each movement file
function testMovementFileData(data, meta) {
  return data.length > 1 && testMovementFileHeaders(meta) && testMovementFileRowsForType(data);
}

// Tests if correct movement file headers
function testMovementFileHeaders(meta) {
  return meta.includes(movementHeaders[0]) && meta.includes(movementHeaders[1]) && meta.includes(movementHeaders[2]);
}

// Loop through data and return true on first row that has all data typed as numbers or false if no rows are properly typed
function testMovementFileRowsForType(data) {
  for (let i = 0; i < data.length; i++) {
    if (typeof data[i][movementHeaders[0]] === 'number' && typeof data[i][movementHeaders[1]] === 'number' && typeof data[i][movementHeaders[2]] === 'number') return true;
  }
  return false;
}

// Returns true if all values are number type
function testMovementDataRowForType(time, x, y) {
  return typeof time === 'number' && typeof x === 'number' && typeof y === 'number';
}

// Determines how to sample data depending on number of data cases or rows vs. pixel length of timeline
// Reduces data size to provide optimal interaction with visualization and good curve drawing
function testSampleMovementData(data, curRow) {
  if (curRow === 0 || curRow === 1) return true; // always return true for first two rows
  const sampleRateDivisor = 4; // temporary but 4 as rate seems to work best on most devices
  if (data.length / sampleRateDivisor < timelineLength) return data[curRow][movementHeaders[0]] > data[curRow - 1][movementHeaders[0]];
  else return Math.floor(data[curRow][movementHeaders[0]]) > Math.floor(data[curRow - 1][movementHeaders[0]]); // if there are more data cases than pixels on timeline, sample based on integer floored values/every second
}

// ***** CONVERSATION FILE TESTS *****
// Tests if there is data in file, if it has correct conversation file headers, and if at least 1 row has good data
function testConversationFileData(data, meta) {
  return data.length > 1 && testConversationFileHeaders(meta) && testConversationFileRowsForType(data);
}

// Tests if current conversation row is less than total rows in table and if time is number and speaker is string and talk turn is not null or undefined
function testConversationDataRow(curRow) {
  return curRow < conversationFileResults.length && typeof conversationFileResults[curRow][conversationHeaders[0]] === 'number' && typeof conversationFileResults[curRow][conversationHeaders[1]] === 'string' && conversationFileResults[curRow][conversationHeaders[2]] !== null && conversationFileResults[curRow][conversationHeaders[2]] !== undefined;
}

// Tests if correct file headers for conversation
function testConversationFileHeaders(meta) {
  return meta.includes(conversationHeaders[0]) && meta.includes(conversationHeaders[1]) && meta.includes(conversationHeaders[2]);
}

// Loop through data and return true on first row with time is number and speaker is string and talk turn is not null or undefined
function testConversationFileRowsForType(data) {
  for (let i = 0; i < data.length; i++) {
    if (typeof data[i][conversationHeaders[0]] === 'number' && typeof data[i][conversationHeaders[1]] === 'string' && data[i][conversationHeaders[2]] !== null && data[i][conversationHeaders[2]] !== undefined) return true;
  }
  return false;
}