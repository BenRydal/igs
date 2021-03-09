function loadFonts() {
  font_PlayfairReg = loadFont("data/fonts/PlayfairDisplay-Regular.ttf");
  font_PlayfairItalic = loadFont("data/fonts/PlayfairDisplay-Italic.ttf");
  font_PlayfairBold = loadFont("data/fonts/PlayfairDisplay-Bold.ttf");
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

// if image: replace floor plan and rerun movement?????
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

// Parses all input selected movement files
function parseExampleMovementFile(input) {
  Papa.parse(input, {
    complete: testMovementFile,
    header: true,
  });
}

// Parses all input selected movement files
function parseInputMovementFile(input) {
  updateMovementData = true; // trigger update data
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
  if (testMovementFileData(results.data, results.meta.fields)) {
    if (updateMovementData) clearDataMovementFileInput(); // clear data if first accepted file
    movementFiles.push([results, file]);
    processMovementFile(results, file);
  }
}

// Processes movement file, adds to path object
function processMovementFile(results, file) {
  let movement = []; // holds movement points (location data)
  let conversation = []; // holds conversaton points (text and location data for conversation)
  let conversationCounter = 0;
  for (let i = 1; i < results.data.length; i++) { // start at second row
    // only process point if has larger time value than previous time value
    if (results.data[i][movementHeaders[0]] > results.data[i - 1][movementHeaders[0]]) {
      let m = new Point_Movement();
      m.time = results.data[i][movementHeaders[0]];
      m.xPos = results.data[i][movementHeaders[1]];
      m.yPos = results.data[i][movementHeaders[2]];
      movement.push(m); // always add to movement
      // load conversation turn and increment counter if movement time is larger than time in conversationFile results at curCounter
      if (conversationCounter < conversationFileResults.length) {
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
  });
}

// Parses conversation file loaded by user input
function parseInputConversationFile(input) {
  let file = input.files[0];
  Papa.parse(file, {
    complete: testConversationFile,
    header: true,
  });
}

function testConversationFile(results, file) {
  console.log("Parsing complete:", results, file);
  if (testConversationHeaders(results.data, results.meta.fields)) {
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
    if (!tempSpeakerList.includes(speaker)) { // if not in list, add new Speaker Object to global speakerList
      let s = new Speaker(speaker, speakerColorList[speakerList.length % speakerColorList.length]);
      speakerList.push(s);
    }
  }
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

function testMovementFileData(data, meta) {
  return data.length > 1 && meta.includes(movementHeaders[0]) && meta.includes(movementHeaders[1]) && meta.includes(movementHeaders[2]);
}

function testConversationHeaders(data, meta) {
  return data.length > 1 && meta.includes(conversationHeaders[0]) && meta.includes(conversationHeaders[1]) && meta.includes(conversationHeaders[2]);
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