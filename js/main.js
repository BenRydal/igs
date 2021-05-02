/*
CREDITS/LICENSE INFORMATION: 
This software is written in JavaScript and p5.js and uses YouTube and Kaltura Video Player APIs and the PapaParse library by Matt Holt for CSV file processing.
This software is licensed under the GNU General Public License Version 2.0. See the GNU General Public License included with this software for more details. 
IGS-Indoor software was originally developed by Ben Rydal Shapiro at Vanderbilt University
as part of his dissertation titled Interaction Geography & the Learning Sciences. 
Copyright (C) 2018 Ben Rydal Shapiro, and contributors. 
To reference or read more about this work please see: 
https://etd.library.vanderbilt.edu/available/etd-03212018-140140/unrestricted/Shapiro_Dissertation.pdf
*/

//*************** FILE INPUT AND CORE VARS ***************
/**
 * Global movement and conversation file results arrays allow dynamic re-processing of individual data files
 */
let movementFileResults = []; // List that holds a results array and character letter indicating path name from a parsed movement .CSV file
let conversationFileResults = []; // List that holds a results array and file data from a parsed conversation .CSV file
let speakerList = []; // List that holds Speaker objects parsed from conversation file
let paths = []; // List that holds path objects for each unique set of movement and conversation points constructed from parsed conversation and movement .CSV files
let floorPlan; // PNG or JPG floorplan image
const movementHeaders = ['time', 'x', 'y']; // String array indicating movement movement file headers, data in each column should be of type number or it won't process
const conversationHeaders = ['time', 'speaker', 'talk']; // String array indicating conversation file headers, data in time column shout be of type number, speaker column should be of type String, talk column should be not null or undefined
let totalTimeInSeconds = 0; // Number indicating time value in seconds that all displayed data is set to, set dynamically in processMovement methods
const PLAN = 0,
    SPACETIME = 1; // Number constants indicating floorplan or space-time drawing modes

/**
 * NOTE: Speaker and path objects are separate due to how P5.js draws shapes in the browser.
 * NOTE: Each speaker and path object can match/correspond to the same person but they don't have to match.
 * This allows variation in the number of movement files and speakers listed.
 */

/**
 * Represents collection of data that comprises an individual speaker
 * NOTE: constructed from conversation .CSV file
 */
class Speaker {
    constructor(name, col) {
        this.name = name; // char indicating letter of speaker
        this.color = col; // color set to gray to start, updated to match corresponding Path if one exists in processMovement
        this.show = true; // boolean indicating speaker is showing in GUI
    }
}

/**
 * Represents collection of data that comrpises a path
 * NOTE: constructed from movement .CSV file
 */
class Path {
    constructor(pathName) {
        this.movement = []; // List of Point_Movement objects
        this.conversation = []; // List of Point_Conversation objects
        this.name = pathName; // Char indicating letter name of path. Matches first letter of movement file name and created when Path is instantiated.
        this.color = undefined; // Color of path, set in processMovement
        this.show = true; // boolean indicates if path is showing/selected
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
    }],
    example_2 = ['data/example-2/', 'floorplan.png', 'conversation.csv', ['Teacher.csv', 'Sean.csv', 'Mei.csv', 'Cassandra.csv', 'Nathan.csv'], 'Youtube', {
        videoId: 'Iu0rxb-xkMk'
    }],
    example_3 = ['data/example-3/', 'floorplan.png', 'conversation.csv', ['Jordan.csv'], 'Youtube', {
        videoId: 'iiMjfVOj8po'
    }],
    example_4 = ['data/example-4/', 'floorplan.png', 'conversation.csv', ['Lily.csv', 'Jeans.csv', 'Adhir.csv', 'Mae.csv', 'Blake.csv'], 'Youtube', {
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
let bugTimePosForVideoScrubbing; // Set in draw movement data and used to display correct video frame when scrubbing video

//*************** GUI ***************
// MODES
let showMovementKeys = true; // boolean controls whether movement or conversation keys show
let conversationPositionTop = false; // boolean controls positioning of conversation turns on path or top of screen
let allConversation = true; // boolean controls whether single speaker or all conversation turns shown on path
let animation = false; // boolean controls animation mode
let animationCounter = 0; // boolean controls current value of animation
// FONTS
let keyTextSize, font_PlayfairReg, font_PlayfairItalic, font_Lato; // text size and fonts
// INTRO MSG
let showIntroMsg = true; // boolean controls intro message
const introMSG = "INTERACTION GEOGRAPHY SLICER (IGS) INDOOR\n\nby Ben Rydal Shapiro & contributers\nbuilt with p5.js & JavaScript\n\nHi There! This is a tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan view (left) and a space-time view (right), where the vertical axis corresponds to the vertical dimension of the floor plan. Use the top menu to visualize different sample datasets or upload your own data. Hover over the floor plan and use the timeline to selectively study displayed data. Use the bottom buttons to animate data, visualize conversation in different ways, and interact with video data by clicking the timeline to play & pause video. To format your data for use in this tool visit: benrydal.com/software/igs-indoor";
// INTERFACE
let timelineStart, timelineEnd, timelineHeight, timelineLength, yPosTimelineTop, yPosTimelineBottom, timelineThickness;
let currPixelTimeMin, currPixelTimeMax; // Rescaled timeline start and end depending on user interactions
const buttons = ["Animate", "Align Talk", "All Talk", "Video", "How to Use"];
let buttonSpacing, buttonWidth, speakerKeysHeight, buttonsHeight;
let lockedLeft = false,
    lockedRight = false;
const selSpacing = 20,
    spacing = 50,
    tickHeight = 25,
    floorPlanSelectorSize = 100;
// Color list--> 12 Class Paired Dark: purple, orange, green, blue, red, yellow, brown, lPurple, lOrange, lGreen, lBlue, lRed
const colorList = ['#6a3d9a', '#ff7f00', '#33a02c', '#1f78b4', '#e31a1c', '#ffff99', '#b15928', '#cab2d6', '#fdbf6f', '#b2df8a', '#a6cee3', '#fb9a99'];

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
    textAlign(LEFT, TOP);
    setGUI();
    textFont(font_Lato, keyTextSize);
}
/**
 * Always draws background and keys. Organizes what data is drawing if it is loaded/not undefined.
 * NOTE: Each conditional tests if particular data structure is loaded (floorplan, paths[], speakerList[], videoPlayer)
 * NOTE: Conversation can never be drawn unless movement has been loaded (paths[])
 * NOTE: Movement can be drawn if conversation has not been loaded
 */
function draw() {
    background(255);
    if (dataIsLoaded(floorPlan)) image(floorPlan, 0, 0, displayFloorPlanWidth, displayFloorPlanHeight);
    if (dataIsLoaded(paths) && dataIsLoaded(speakerList)) setMovementAndConversationData();
    else if (dataIsLoaded(paths)) setMovementData();
    if (dataIsLoaded(videoPlayer) && videoIsShowing) {
        if (!videoIsPlaying) setVideoScrubbing();
        if (mouseX !== pmouseX || mouseY !== pmouseY) select('#moviePlayer').position(mouseX - videoWidth, mouseY - videoHeight);
    }
    let keys = new Keys();
    keys.drawKeys();
}
/**
 * Returns false if parameter is undefined or null
 * @param  {} data
 */
function dataIsLoaded(data) {
    return data != null; // in javascript this tests for both undefined and null values
}