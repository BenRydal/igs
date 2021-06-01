/*
CREDITS/LICENSE INFORMATION: 
This software is written in JavaScript and p5.js and uses YouTube and Kaltura Video Player APIs and the PapaParse library by Matt Holt for CSV file processing. 
This software is licensed under the GNU General Public License Version 2.0. 
See the GNU General Public License included with this software for more details. 
Classroom discussion example data is used with special permission from Mathematics Teaching and Learning to Teach (MTLT), 
University of Michigan. (2010). Sean Numbers-Ofala. Classroom science lesson data is made possible by the researchers 
and teachers who created The Third International Mathematics and Science Study (TIMSS) 1999 Video Study. 
IGS software was originally developed by Ben Rydal Shapiro at Vanderbilt University 
as part of his dissertation titled Interaction Geography & the Learning Sciences. 
Copyright (C) 2018 Ben Rydal Shapiro, and contributors. 
To reference or read more about this work please see: 
https://etd.library.vanderbilt.edu/available/etd-03212018-140140/unrestricted/Shapiro_Dissertation.pdf
*/

// have class for constants, declare globally--could have "speaker/path etc. classes"
// movie video variables under videoPlayer interface/as part of VideoPlayer object?
// movie functions in GUI to new class and add mode variables

//*************** FILE INPUT AND CORE VARS ***************
/**
 * Global movement and conversation file results arrays allow dynamic re-processing of individual data files
 */
let exampleData;
let parseData;
let processData;
let testData;
let keys;
let handlers;

// let core; // ???
let movementFileResults = []; // List that holds a results array and character letter indicating path name from a parsed movement .CSV file
let conversationFileResults = []; // List that holds a results array and file data from a parsed conversation .CSV file
let speakerList = []; // List that holds Speaker objects parsed from conversation file
let paths = []; // List that holds path objects for each unique set of movement and conversation points constructed from parsed conversation and movement .CSV files
let floorPlan; // PNG or JPG floorplan image

// Constants
const movementHeaders = ['time', 'x', 'y']; // String array indicating movement movement file headers, data in each column should be of type number or it won't process
const conversationHeaders = ['time', 'speaker', 'talk']; // String array indicating conversation file headers, data in time column shout be of type number, speaker column should be of type String, talk column should be not null or undefined
const PLAN = 0, // Number constants indicating floorplan or space-time drawing modes
    SPACETIME = 1,
    NO_DATA = -1;
// Color list--> 12 Class Paired Dark: purple, orange, green, blue, red, yellow, brown, lPurple, lOrange, lGreen, lBlue, lRed
const colorList = ['#6a3d9a', '#ff7f00', '#33a02c', '#1f78b4', '#e31a1c', '#ffff99', '#b15928', '#cab2d6', '#fdbf6f', '#b2df8a', '#a6cee3', '#fb9a99'];
const introMSG = "INTERACTION GEOGRAPHY SLICER (IGS)\n\nby Ben Rydal Shapiro & contributors\nbuilt with p5.js & JavaScript\n\nHi There! This is a tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan view (left) and a space-time view (right), where the vertical axis corresponds to the vertical dimension of the floor plan. Use the top menu to visualize different sample datasets or upload your own data. Hover over the floor plan and use the timeline to selectively study displayed data. Use the bottom buttons to animate data, visualize conversation in different ways, and interact with video data by clicking the timeline to play & pause video. For more information see: benrydal.com/software/igs";
const buttons = ["Animate", "Align Talk", "All Talk", "Video", "How to Use"];

// MODES
// isModeMovement
// isModeConvoTop
let showMovementKeys = true; // boolean controls whether movement or conversation keys show
let conversationPositionTop = false; // boolean controls positioning of conversation turns on path or top of screen
let allConversation = true; // boolean controls whether single speaker or all conversation turns shown on path
let animation = false; // boolean controls animation mode
let animationCounter = 0; // boolean controls current value of animation
let showIntroMsg = true; // boolean controls intro message

const SELPADDING = 20;
let inputFloorPlanPixelWidth, inputFloorPlanPixelHeight; // Number indicating pixel width/height of user inputted floor plan image file
let totalTimeInSeconds = 0; // Number indicating time value in seconds that all displayed data is set to, set dynamically in processMovement methods
let font_PlayfairReg, font_PlayfairItalic, font_Lato;

/**
 * Video functionality is comprised of a movie Div and a VideoPlayer object/interface that allows different
 * ways of loading/playing videos (e.g., from YouTube, user inputted files).
 * NOTE: videoPlayer is instantiated and destroyed when new video is loaded in processVideo. 
 * Initialize methods in VideoPlayer create movie Div in different ways depending on platform.
 * See video-player .js.
 *  */
let movie; // Div to hold the videoPlayer object
let videoPlayer; // Object to interact with platform specific set of video player methods
let videoIsPlaying = false; // boolean indicating video is playing
let videoIsShowing = false; // boolean indicating video is showing in GUI
let videoWidth, videoHeight; // Number pixel width and height of video set in setup
let bugTimePosForVideoScrubbing; // Set in draw movement data and used to display correct video frame when scrubbing video

/**
 * Optional P5.js method, here used to preload fonts
 */
function preload() {
    font_PlayfairReg = loadFont("data/fonts/PlayfairDisplay-Regular.ttf");
    font_PlayfairItalic = loadFont("data/fonts/PlayfairDisplay-Italic.ttf");
    font_Lato = loadFont("data/fonts/Lato-Light.ttf");
}

/**
 * Required P5.js method, here used to setup GUI
 */
function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight, P2D);
    frameRate(30);
    parseData = new ParseData();
    exampleData = new ExampleData();
    processData = new ProcessData();
    testData = new TestData();
    keys = new Keys();
    handlers = new Handlers();

    textAlign(LEFT, TOP);
    textFont(font_Lato, keys.keyTextSize);
    videoWidth = width / 5;
    videoHeight = width / 6;
}
/**
 * Always draws background and keys. Organizes what data is drawing if it is loaded/not undefined.
 * NOTE: Each conditional tests if particular data structure is loaded (floorplan, paths[], speakerList[], videoPlayer)
 * NOTE: Conversation can never be drawn unless movement has been loaded (paths[])
 * NOTE: Movement can be drawn if conversation has not been loaded
 */
function draw() {
    background(255);
    if (dataIsLoaded(floorPlan)) image(floorPlan, 0, 0, keys.displayFloorPlanWidth, keys.displayFloorPlanHeight);
    if (dataIsLoaded(paths) && dataIsLoaded(speakerList)) setMovementAndConversationData();
    else if (dataIsLoaded(paths)) setMovementData();
    if (dataIsLoaded(videoPlayer) && videoIsShowing && (mouseX !== pmouseX || mouseY !== pmouseY)) {
        if (!videoIsPlaying) setVideoScrubbing();
        select('#moviePlayer').position(mouseX - videoWidth, mouseY - videoHeight);
    }
    keys.drawKeys();
}
/**
 * Returns false if parameter is undefined or null
 * @param  {Any Type} data
 */
function dataIsLoaded(data) {
    return data != null; // in javascript this tests for both undefined and null values
}
/**
 * Organizes drawing methods for movement and conversation drawData classes
 * Also organizes drawing of slicer line, conversation bubble if selected by user, and updating animation
 */
function setMovementAndConversationData() {
    let drawConversationData = new DrawDataConversation();
    let drawMovementData = new DrawDataMovement();
    for (let i = 0; i < paths.length; i++) {
        if (paths[i].show) {
            drawConversationData.setData(paths[i]);
            drawMovementData.setData(paths[i]); // draw after conversation so bug displays on top
        }
    }
    if (overRect(keys.timelineStart, 0, keys.timelineLength, keys.timelineHeight)) drawMovementData.drawSlicer(); // draw slicer line after calculating all movement
    drawConversationData.setConversationBubble(); // draw conversation text last so it displays on top
    if (animation) setUpAnimation();
}

/**
 * Organizes drawing methods for movement drawData class only
 * Also organizes drawing of slicer line and updating animation
 */
function setMovementData() {
    let drawMovementData = new DrawDataMovement();
    for (let i = 0; i < paths.length; i++) {
        if (paths[i].show) drawMovementData.setData(paths[i]); // draw after conversation so bug displays on top
    }
    if (overRect(keys.timelineStart, 0, keys.timelineLength, keys.timelineHeight)) drawMovementData.drawSlicer(); // draw slicer line after calculating all movement
    if (animation) setUpAnimation();
}

/**
 * Updates global animation counter to control animation or sets animation to false if animation complete
 */
function setUpAnimation() {
    let animationIncrementRateDivisor = 1000; // this seems to work best
    // Get amount of time in seconds currently displayed
    let curTimeIntervalInSeconds = map(keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd, 0, totalTimeInSeconds) - map(keys.curPixelTimeMin, keys.timelineStart, keys.timelineEnd, 0, totalTimeInSeconds);
    // set increment value based on that value/divisor to keep constant animation speed regardless of time interval selected
    let animationIncrementValue = curTimeIntervalInSeconds / animationIncrementRateDivisor;
    if (animationCounter < map(keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd, 0, totalTimeInSeconds)) animationCounter += animationIncrementValue; // updates animation
    else animation = false;
}

/**
 * Updates time selected in video depending on mouse position or animation over timeline
 */
function setVideoScrubbing() {
    if (animation) {
        let startValue = map(keys.curPixelTimeMin, keys.timelineStart, keys.timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())); // remap starting point to seek for video
        let endValue = map(keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())); // remap starting point to seek for video
        let vPos = Math.floor(map(bugTimePosForVideoScrubbing, keys.timelineStart, keys.timelineEnd, startValue, endValue));
        videoPlayer.seekTo(vPos);
    } else if (overRect(keys.timelineStart, 0, keys.timelineEnd, keys.timelineHeight)) {
        let mPos = map(mouseX, keys.timelineStart, keys.timelineEnd, keys.curPixelTimeMin, keys.curPixelTimeMax); // first map mouse to selected time values in GUI
        // must floor vPos to prevent double finite error
        let vPos = Math.floor(map(mPos, keys.timelineStart, keys.timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())));
        videoPlayer.seekTo(vPos);
        videoPlayer.pause(); // Add to prevent accidental video playing that seems to occur
    }
}

/**
 * Organizes mousePressed method calls for video, movement/conversation and interaction buttons and path/speaker keys
 */
function mousePressed() {
    handlers.handleMousePressed();
}

function mouseDragged() {
    handlers.handleMouseDragged();
}

function mouseReleased() {
    handlers.handleMouseReleased();
}

function overCircle(x, y, diameter) {
    const disX = x - mouseX;
    const disY = y - mouseY;
    return sqrt(sq(disX) + sq(disY)) < diameter / 2;
}

// Tests if over rectangle with x, y, and width/height
function overRect(x, y, boxWidth, boxHeight) {
    return mouseX >= x && mouseX <= x + boxWidth && mouseY >= y && mouseY <= y + boxHeight;
}