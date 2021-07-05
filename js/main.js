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
 * Classes/modules treated as singletons with respective .js file/module
 */
let core; // core program variables and factory functions
let controller; // handles DOM/button user interaction and initial data parsing
let processData; // handles all data processing
let testData; // data loading/sampling tests
let keys; // interface vars and methods
let videoPlayer; // abstract class for different play classes instantiated/updated in processVideo method (see video-player.js)

/**
 * Constants
 */
const CSVHEADERS_MOVEMENT = ['time', 'x', 'y']; // String array indicating movement movement file headers, data in each column should be of type number or it won't process
const CSVHEADERS_CONVERSATION = ['time', 'speaker', 'talk']; // String array indicating conversation file headers, data in time column shout be of type number, speaker column should be of type String, talk column should be not null or undefined
let font_Lato;
// MODES
let isModeMovement = true; // boolean controls whether movement or conversation keys show
let isModeAnimate = false; // boolean controls positioning of conversation turns on path or top of screen
let isModeAlignTalkTop = false; // boolean controls whether single speaker or all conversation turns shown on path
let isModeAllTalkOnPath = true; // boolean controls isModeAnimate mode
let isModeIntro = true; // boolean controls intro message
let isModeVideoPlaying = false; // boolean indicating video is playing
let isModeVideoShowing = false; // boolean indicating video is showing in GUI
let animationCounter = 0; // counter to synchronize animation across all data
let bugTimePosForVideoScrubbing = null; // Set in draw movement data and used to display correct video frame when scrubbing video


function preload() {
    font_Lato = loadFont("data/fonts/Lato-Light.ttf");
}

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight, P2D);
    core = new Core();
    keys = new Keys();
    controller = new Controller();
    processData = new ProcessData();
    testData = new TestData();
    videoPlayer = null;
}

/**
 * Organizes draw loop depending on data that has been loaded and animation state
 */
function draw() {
    background(255);
    if (testData.dataIsLoaded(core.floorPlan.img)) image(core.floorPlan.img, 0, 0, keys.displayFloorPlanWidth, keys.displayFloorPlanHeight);
    if (testData.arrayIsLoaded(core.paths)) {
        if (testData.arrayIsLoaded(core.speakerList)) setMovementAndConversation();
        else setMovement();
    }
    if (testData.dataIsLoaded(videoPlayer) && isModeVideoShowing) setVideoPosition();
    keys.drawKeys(); // draw keys last
    if (isModeAnimate) this.setUpAnimation();
    if (isModeAnimate || isModeVideoPlaying) loop();
    else noLoop();
}

/**
 * Organizes drawing methods for movement and conversation including slicer line and conversation bubble
 */
function setMovementAndConversation() {
    const drawConversationData = new DrawDataConversation();
    const drawMovementData = new DrawDataMovement();
    for (const path of core.paths) {
        if (path.show) {
            drawConversationData.setData(path);
            drawMovementData.setData(path); // draw after conversation so bug displays on top
        }
    }
    drawConversationData.setConversationBubble(); // draw conversation text last so it displays on top
}

/**
 * Organizes drawing methods for movement only
 */
function setMovement() {
    let drawMovementData = new DrawDataMovement();
    for (const path of core.paths) {
        if (path.show) drawMovementData.setData(path); // draw after conversation so bug displays on top
    }
}

/**
 * Updates animation mode variable depending on animation state
 */
function setUpAnimation() {
    const animationIncrementRateDivisor = 1000; // this divisor seems to work best
    // Get amount of time in seconds currently displayed
    const curTimeIntervalInSeconds = map(keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd, 0, core.totalTimeInSeconds) - map(keys.curPixelTimeMin, keys.timelineStart, keys.timelineEnd, 0, core.totalTimeInSeconds);
    // set increment value based on that value/divisor to keep constant isModeAnimate speed regardless of time interval selected
    const animationIncrementValue = curTimeIntervalInSeconds / animationIncrementRateDivisor;
    if (animationCounter < map(keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd, 0, core.totalTimeInSeconds)) animationCounter += animationIncrementValue;
    else isModeAnimate = false;
}
/**
 * Updates video position to curMousePosition and calls scrubbing method if not playing
 */
function setVideoPosition() {
    if (!isModeVideoPlaying) this.setVideoScrubbing();
    select('#moviePlayer').position(mouseX - videoPlayer.videoWidth, mouseY - videoPlayer.videoHeight);
}
/**
 * Updates time selected in video depending on mouse position or isModeAnimate over timeline
 */
function setVideoScrubbing() {
    if (isModeAnimate) {
        const startValue = map(keys.curPixelTimeMin, keys.timelineStart, keys.timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())); // remap starting point to seek for video
        const endValue = map(keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())); // remap starting point to seek for video
        const vPos = Math.floor(map(bugTimePosForVideoScrubbing, keys.timelineStart, keys.timelineEnd, startValue, endValue));
        videoPlayer.seekTo(vPos);
    } else if (keys.overRect(keys.timelineStart, 0, keys.timelineEnd, keys.timelineHeight)) {
        const mPos = map(mouseX, keys.timelineStart, keys.timelineEnd, keys.curPixelTimeMin, keys.curPixelTimeMax); // first map mouse to selected time values in GUI
        // must floor vPos to prevent double finite error
        const vPos = Math.floor(map(mPos, keys.timelineStart, keys.timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())));
        videoPlayer.seekTo(vPos);
        videoPlayer.pause(); // Add to prevent accidental video playing that seems to occur
    }
}

function mousePressed() {
    // Controls video when clicking over timeline region
    if (isModeVideoShowing && !isModeAnimate && keys.overRect(keys.timelineStart, 0, keys.timelineEnd, keys.yPosTimelineBottom)) keys.playPauseMovie();
    keys.overMovementConversationButtons();
    keys.overInteractionButtons();
    if (isModeMovement) keys.overPathKeys();
    else keys.overSpeakerKeys();
    loop();
}

/**
 * Organizes timeline GUI methods. this.selPadding used to provide additionl "cushion" for mouse.
 * NOTE: To activate timeline methods, isModeAnimate mode must be false and 
 * Either mouse already dragging over timeline OR mouse cursor is over timeline bar.
 */
function mouseDragged() {
    if (!isModeAnimate && ((keys.lockedLeft || keys.lockedRight) || keys.overRect(keys.timelineStart - keys.selPadding, keys.yPosTimelineTop, keys.timelineLength + keys.selPadding, keys.timelineThickness))) keys.handleTimeline();
    loop();
}

function mouseReleased() {
    keys.lockedLeft = false;
    keys.lockedRight = false;
    loop();
}

function mouseMoved() {
    loop();
}