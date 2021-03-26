function loadFonts() {
  font_PlayfairReg = loadFont("data/fonts/PlayfairDisplay-Regular.ttf");
  font_PlayfairItalic = loadFont("data/fonts/PlayfairDisplay-Italic.ttf");
  font_Lato = loadFont("data/fonts/Lato-Light.ttf");
}

function loadExampleDataSet() {
  updateMovementData = true; // trigger update data
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

  fetch(new Request(params[0] + params[2]))
    .then(response => response.arrayBuffer())
    .then(buffer => {
      conversationFileResults = new File([buffer], params[2], {
        type: "text/csv",
      });
      parseExampleConversationFile(conversationFileResults);
    }).catch(e => {
      print("Error loading example conversation file");
    });

  // create an initial immediately resolving promise, and then chain new promises as the previous ones resolve:
  // see https://stackoverflow.com/questions/40328932/javascript-es6-promise-for-loop
  for (let i = 0, p = Promise.resolve(); i < params[3].length; i++) {
    p = p.then(_ => new Promise(resolve =>
      setTimeout(function () {
        let myRequest = new Request(params[0] + params[3][i]);
        fetch(myRequest)
          .then(response => response.arrayBuffer())
          .then(buffer => new File([buffer], params[3][i], {
            type: "text/csv",
          }))
          .then(file => {
            parseExampleMovementFile(file);
          }).catch(e => {
            print("Error loading example movement file");
          });
        resolve();
      })));
  }
}

// Uploads floor plan image file and sends to update global floor plan image vars
function parseInputFloorPlanFile(input) {
  let file = input.files[0];
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

// Parses example movement files
function parseExampleMovementFile(input) {
  Papa.parse(input, {
    complete: testMovementFile,
    header: true,
    dynamicTyping: true,
  });
}

// Parses all input selected movement files
function parseInputMovementFile(input) {
  updateMovementData = true; // trigger update data
  for (let i = 0; i < input.files.length; i++) {
    let file = input.files[i];
    //input.value = ''; // reset input value so you can load same file again in browser
    Papa.parse(file, {
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
    //print(movementFiles[0][1].name.charAt(0));
    //movementFiles.sort((a, b) => (a[1].name > b[1].name) ? 1 : -1); // sort list so it appears nicely in GUI
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
    if (testSampleMovementData(results.data, i) && testMovementDataRow(results.data[i][movementHeaders[0]], results.data[i][movementHeaders[1]], results.data[i][movementHeaders[2]])) {
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

// Parses conversation file loaded by example data
function parseExampleConversationFile(file) {
  Papa.parse(file, {
    complete: testConversationFile,
    header: true,
    dynamicTyping: true,
  });
}

// Parses conversation file loaded by user input
function parseInputConversationFile(input) {
  let file = input.files[0];
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
  speakerList.sort((a, b) => (a.name > b.name) ? 1 : -1); // sort list so it appears nicely in GUI
}

// parses inputted video files from user computer
function parseInputVideoFile(input) {
  if (videoIsShowing) overVideoButton(); // Turn off video that if showing
  let file = input.files[0];
  let fileLocation = URL.createObjectURL(file);
  processVideo('File', {
    fileName: fileLocation
  });
}

// Creates movie element specific to videoPlatform and params
function processVideo(videoPlatform, videoParams) {
  noLoop(); // stop program loop while loading video, restarted upon video loaded in videoPlayer or in processVideoFile if loading from file
  if (videoPlayer !== undefined) destroyMovieAndPlayer(); // if first time player loaded at program start it will be undefined, don't destroy it
  if (videoPlatform === 'File') processVideoFromFile(videoPlatform, videoParams);
  else processVideoFromWeb(videoPlatform, videoParams);
}

// Destroy exisiting player and remove exisiting movie element
function destroyMovieAndPlayer() {
  videoPlayer.destroy();
  movie.remove();
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
  updateMovementData = false;
}

// ***** MOVEMENT FILE TESTS *****
// Determines how to sample data depending on number of data cases or rows vs. pixel length of timeline
// Reduces data size to provide optimal interaction with visualization and good curve drawing
function testSampleMovementData(data, curRow) {
  if (curRow === 0) return true; // always return true for first row
  const sampleRateDivisor = 4; // temporary but 4 as rate seems to work best on most devices
  if (data.length / sampleRateDivisor < timelineLength) return data[curRow][movementHeaders[0]] > data[curRow - 1][movementHeaders[0]];
  else return Math.floor(data[curRow][movementHeaders[0]]) > Math.floor(data[curRow - 1][movementHeaders[0]]); // if there are more data cases than pixels on timeline, sample based on integer floored values/every second
}

function testMovementDataRow(time, x, y) {
  return typeof time === 'number' && typeof x === 'number' && typeof y === 'number';
}

// Test if there is data in file, if it has correct movement file headers, and if first row of values is of correct type for each movement file
function testMovementFileData(data, meta) {
  return data.length > 1 && testMovementFileHeaders(meta) && testMovementFileForGoodRow(data);
}

// Tests if correct movement file headers
function testMovementFileHeaders(meta) {
  return meta.includes(movementHeaders[0]) && meta.includes(movementHeaders[1]) && meta.includes(movementHeaders[2]);
}

// Loop through data and return true on first row that has all data typed as numbers or false if no rows are properly typed
function testMovementFileForGoodRow(data) {
  for (let i = 0; i < data.length; i++) {
    if (typeof data[i][movementHeaders[0]] === 'number' && typeof data[i][movementHeaders[1]] === 'number' && typeof data[i][movementHeaders[2]] === 'number') return true;
  }
  return false;
}

// ***** CONVERSATION FILE TESTS *****
// Tests if current conversation row is less than total rows in table and if time is number and speaker is string and talk turn is not null or undefined
function testConversationDataRow(curRow) {
  return curRow < conversationFileResults.length && typeof conversationFileResults[curRow][conversationHeaders[0]] === 'number' && typeof conversationFileResults[curRow][conversationHeaders[1]] === 'string' && conversationFileResults[curRow][conversationHeaders[2]] !== null && conversationFileResults[curRow][conversationHeaders[2]] !== undefined;
}

// Tests if there is data in file, if it has correct conversation file headers, and if at least 1 row has good data
function testConversationFileData(data, meta) {
  return data.length > 1 && testConversationFileHeaders(meta) && testConversationFileForGoodRow(data);
}

// Tests if correct file headers for conversation
function testConversationFileHeaders(meta) {
  return meta.includes(conversationHeaders[0]) && meta.includes(conversationHeaders[1]) && meta.includes(conversationHeaders[2]);
}

// Loop through data and return true on first row with time is number and speaker is string and talk turn is not null or undefined
function testConversationFileForGoodRow(data) {
  for (let i = 0; i < data.length; i++) {
    if (typeof data[i][conversationHeaders[0]] === 'number' && typeof data[i][conversationHeaders[1]] === 'string' && data[i][conversationHeaders[2]] !== null && data[i][conversationHeaders[2]] !== undefined) return true;
  }
  return false;
}