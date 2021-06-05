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

/**
 * CLASSES/MODULES
 * Each class is currently treated as a singleton with respective .js file/module
 */
let core;
let setData;
let exampleData;
let parseData;
let processData;
let testData;
let keys;
let handlers;

/**
 * videoPlayer acts like an abstract class with different video classes defined in video-player.js.
 * videoPlayer is instantiated/updated in processVideo method
 * movie holds the "Div" created/destroyed by different video classes
 */
let videoPlayer;
let movie;

/**
 * CONSTANTS
 */
const CSVHEADERS_MOVEMENT = ['time', 'x', 'y']; // String array indicating movement movement file headers, data in each column should be of type number or it won't process
const CSVHEADERS_CONVERSATION = ['time', 'speaker', 'talk']; // String array indicating conversation file headers, data in time column shout be of type number, speaker column should be of type String, talk column should be not null or undefined
const PLAN = 0; // Number constants plan and spacetime indicate two drawing modes
const SPACETIME = 1;
const NO_DATA = -1;
const INTROMSG = "INTERACTION GEOGRAPHY SLICER (IGS)\n\nby Ben Rydal Shapiro & contributors\nbuilt with p5.js & JavaScript\n\nHi There! This is a tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan view (left) and a space-time view (right), where the vertical axis corresponds to the vertical dimension of the floor plan. Use the top menu to visualize different sample datasets or upload your own data. Hover over the floor plan and use the timeline to selectively study displayed data. Use the bottom BUTTON_NAMES to animate data, visualize conversation in different ways, and interact with video data by clicking the timeline to play & pause video. For more information see: benrydal.com/software/igs";
const BUTTON_NAMES = ["Animate", "Align Talk", "All Talk", "Video", "How to Use"];
const COLOR_LIST = ['#6a3d9a', '#ff7f00', '#33a02c', '#1f78b4', '#e31a1c', '#ffff99', '#b15928', '#cab2d6', '#fdbf6f', '#b2df8a', '#a6cee3', '#fb9a99'];
// 12 Class Paired: (Dark) purple, orange, green, blue, red, yellow, brown, (Light) lPurple, lOrange, lGreen, lBlue, lRed

/**
 * Required P5.js method, here used to setup GUI
 */
function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight, P2D);
    core = new Core();
    setData = new SetData();
    parseData = new ParseData();
    exampleData = new ExampleData();
    processData = new ProcessData();
    testData = new TestData();
    keys = new Keys();
    handlers = new Handlers();
}

/**
 * Draws background, keys and organizes drawing of different data sources if data is loaded
 * Continues looping if animate or videoPlaying mode is true
 */
function draw() {
    background(255);
    if (testData.dataIsLoaded(core.floorPlan)) image(core.floorPlan, 0, 0, keys.displayFloorPlanWidth, keys.displayFloorPlanHeight);
    if (testData.dataIsLoaded(core.paths) && testData.dataIsLoaded(core.speakerList)) setData.setMovementAndConversationData();
    else if (testData.dataIsLoaded(core.paths)) setData.setMovementData();
    if (testData.dataIsLoaded(videoPlayer) && core.isModeVideoShowing && (mouseX !== pmouseX || mouseY !== pmouseY)) {
        if (!core.isModeVideoPlaying) setData.setVideoScrubbing();
        select('#moviePlayer').position(mouseX - videoPlayer.videoWidth, mouseY - videoPlayer.videoHeight);
    }
    keys.drawKeys(); // draw keys last
    if (core.isModeAnimate || core.isModeVideoPlaying) loop();
    else noLoop();
}

function mousePressed() {
    handlers.handleMousePressed();
    loop(); // Update all drawing if mouse pressed
}

function mouseDragged() {
    handlers.handleMouseDragged();
    loop(); // Update all drawing if mouse dragged
}

function mouseReleased() {
    handlers.handleMouseReleased();
    loop(); // Update all drawing if mouse released
}

function mouseMoved() {
    loop(); // Update all drawing if mouse moves
}