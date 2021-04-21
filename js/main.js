/*
CREDITS/LICENSE INFORMATION: This software is licensed under the GNU General Public License Version 2.0. See the GNU General Public License included with this software for more details. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details. IGS software originally developed by Ben Rydal Shapiro at Vanderbilt University as part of his dissertation titled Interaction Geography & the Learning Sciences. Copyright (C) 2018 Ben Rydal Shapiro, and contributers. To reference or read more about this work please see: https://etd.library.vanderbilt.edu/available/etd-03212018-140140/unrestricted/Shapiro_Dissertation.pdf
*/

//*************** FILE INPUT AND CORE VARS ***************
/**
 * Global movement and conversation file results arrays allow dynamic re-processing of individual data files
 */
let movementFileResults = []; // List that holds a results array and file data from a parsed movement .CSV file
let conversationFileResults = []; // List that holds a results array and file data from a parsed conversation .CSV file
let speakerList = []; // List that holds Speaker objects parsed from conversation file
let paths = []; // holds path objects for each unique set of movement and conversation points
let floorPlan; // PNG or JPG floorplan image
const movementHeaders = ['time', 'x', 'y']; // String array indicating movement movement file headers, data in each column should be of type number or it won't process
const conversationHeaders = ['time', 'speaker', 'talk']; // String array indicating conversation file headers, data in time column shout be of type number, speaker column should be of type String, talk column should be not null or undefined

/**
 * NOTE: Each speaker and path object can match/correspond to the same person but they don't have to match
 * This allows variation in the number of movement files and speakers listed.
 */

/**
 * Represents collection of data that comprises an individual speaker
 * NOTE: constructed from conversation .CSV file
 */
class Speaker {
    constructor(sName, sCol) {
        this.name = sName;
        this.color = sCol;
        this.show = true;
    }
}

/**
 * Represents collection of data that comrpises a path
 * NOTE: constructed from movement .CSV file
 */
class Path {
    constructor(pathName, pathColor) {
        this.movement = []; // List of Point_Movement objects
        this.conversation = []; // List of Point_Conversation objects
        this.show = true; // boolean indicates if path is showing/selected
        this.name = pathName; // Char indicating letter name of path
        this.color = pathColor; // Color of path
    }
}

/**
 * Represents a point on a path
 * NOTE: constructed from each row/case in a .CSV movement file
 */
class Point_Movement {
    constructor(xPos, yPos, time) {
        this.xPos = xPos; // Number x and y position used to set pixel position
        this.yPos = yPos;
        this.time = time; // Time value in seconds
    }
}

/**
 * Represents a point with conversation on a path
 * NOTE: constructed from both .CSV movement and conversation files
 */
class Point_Conversation {
    constructor(xPos, yPos, time, speaker, talkTurn) {
        this.xPos = xPos; // Number x and y positions used to set pixel position, constructed from movement .CSV file
        this.yPos = yPos;
        this.time = time; // Time value in seconds
        this.speaker = speaker; // Char indicating letter name of speaker
        this.talkTurn = talkTurn; // String of text indicating spoken conversation
    }
}

//*************** EXAMPLE DATA ***************
/**
 * Data is dynamically loaded into program when selected by user
 * Format as: {directory, floorplan image, conversation File, movement File[], video platform, video params (see Video Player Interface)}
 */
const example_1 = ['data/example-1/', 'floorplan.png', 'conversation.csv', ['Teacher.csv'], 'Youtube', {
    videoId: 'Iu0rxb-xkMk'
}];
const example_2 = ['data/example-2/', 'floorplan.png', 'conversation.csv', ['Teacher.csv', 'Sean.csv', 'Mei.csv', 'Cassandra.csv', 'Nathan.csv'], 'Youtube', {
    videoId: 'Iu0rxb-xkMk'
}];
const example_3 = ['data/example-3/', 'floorplan.png', 'conversation.csv', ['Jordan.csv'], 'Youtube', {
    videoId: 'iiMjfVOj8po'
}];
const example_4 = ['data/example-4/', 'floorplan.png', 'conversation.csv', ['Lily.csv', 'Jeans.csv', 'Adhir.csv', 'Mae.csv', 'Blake.csv'], 'Youtube', {
    videoId: 'pWJ3xNk1Zpg'
}];

//*************** FLOOR PLAN AND VIDEO ***************
let inputFloorPlanPixelWidth, inputFloorPlanPixelHeight; // Number indicating pixel width/height of user inputted floor plan image file
let displayFloorPlanWidth, displayFloorPlanHeight; // Number indicating rescaled pixel width/height of floor plan image to display container in GUI
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

//*************** GUI ***************
let updateMovementData = false; // controls accepting first input file to trigger update data processing
let totalTimeInSeconds = 0; // global time value that all data corresponds to, dynamically set and updated in processMovementFiles
const PLAN = 0,
    SPACETIME = 1; // constants to indicate plan or space-time views
let movementKeyTitle = true;
let conversationPositionTop = false; // controls positioning of conversation turns on path or top of screen
let allConversation = true; // shows all speaker turns on path, set to true for example 1 currently
let showIntroMsg; // sets intro message to start program
let font_PlayfairReg, font_PlayfairItalic, font_Lato;
let buttonSpacing, buttonWidth, speakerKeysHeight, buttonsHeight;
const floorPlanSelectorSize = 100;
let bugPrecision, bugSize;
let bugTimePosForVideo; // to draw slicer line when video is playing
// purple, orange, green, blue, red, yellow, brown, lPurple, lOrange, lGreen, lBlue, lRed
const speakerColorList = ['#6a3d9a', '#ff7f00', '#33a02c', '#1f78b4', '#e31a1c', '#ffff99', '#b15928', '#cab2d6', '#fdbf6f', '#b2df8a', '#a6cee3', '#fb9a99'];
const colorGray = (150, 220),
    pathWeight = 3,
    basePathColor = 100; // for paths that don't have associated speaker in speakerList
let animationCounter = 0; // controls animation
let animation = false;
// TIMELINE
let lockedLeft = false,
    lockedRight = false;
const selSpacing = 20,
    spacing = 50,
    tickHeight = 25;
let currPixelTimeMin, currPixelTimeMax;
let yPosTimeScaleTop, yPosTimeScaleBottom, yPosTimeScaleSize;
let timelineStart, timelineEnd, timelineHeight, timelineLength;
// BUTTONS
const button_1 = "Animate",
    button_2 = "Align Talk",
    button_3 = "All Talk",
    button_4 = "Video",
    button_5 = "How to Use";
let keyTextSize;

// MESSAGES
const introMSG = "INTERACTION GEOGRAPHY SLICER (IGS) INDOOR\n\nby Ben Rydal Shapiro & contributers\nbuilt with p5.js & JavaScript\n\nHi There! This is a tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan view (left) and a space-time view (right), where the vertical axis corresponds to the vertical dimension of the floor plan. Use the top menu to visualize different sample datasets or upload your own data. Hover over the floor plan and use the timeline to selectively study displayed data. Use the bottom buttons to animate data, visualize conversation in different ways, and interact with video data by clicking the timeline to play & pause video.\n\nTo format your data for use in this tool visit: benrydal.com/software/igs-indoor";

// Loads fonts and starting example
function preload() {
    font_PlayfairReg = loadFont("data/fonts/PlayfairDisplay-Regular.ttf");
    font_PlayfairItalic = loadFont("data/fonts/PlayfairDisplay-Italic.ttf");
    font_Lato = loadFont("data/fonts/Lato-Light.ttf");
    loadExample(example_1);
}

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight, P2D);
    frameRate(30);
    textFont(font_Lato, 14);
    textAlign(LEFT, TOP);
    showIntroMsg = true;
    setGUI();
}

function draw() {
    background(255);
    image(floorPlan, 0, 0, displayFloorPlanWidth, displayFloorPlanHeight);
    let drawConversationData = new DrawDataConversation();
    let drawMovementData = new DrawDataMovement();
    for (let i = 0; i < paths.length; i++) {
        if (paths[i].show) {
            drawConversationData.setData(paths[i]);
            drawMovementData.setData(paths[i]); // draw after conversation so bug displays on top
        }
    }
    drawConversationData.setConversationBubble(); // draw conversation text last so it displays on top
    if (animation) setUpAnimation();
    if (videoIsShowing && !videoIsPlaying) updateVideoScrubbing();
    let keys = new Keys();
    keys.drawKeys();
}