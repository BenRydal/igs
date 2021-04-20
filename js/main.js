/*
CREDITS/LICENSE INFORMATION: This software is licensed under the GNU General Public License Version 2.0. See the GNU General Public License included with this software for more details. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details. IGS software originally developed by Ben Rydal Shapiro at Vanderbilt University as part of his dissertation titled Interaction Geography & the Learning Sciences. Copyright (C) 2018 Ben Rydal Shapiro, and contributers. To reference or read more about this work please see: https://etd.library.vanderbilt.edu/available/etd-03212018-140140/unrestricted/Shapiro_Dissertation.pdf
*/

// INPUT FILE & DATA VARIABLES
let floorPlan; // holds floor plan image
let movementFiles = []; // holds movement files, globally important for dynamic file loading
let conversationFileResults = []; // holds parsed conversation file, globally important for dynamic file loading
let speakerList = []; // holds speaker objects parsed from conversation file
let paths = []; // holds path objects for each unique set of movement and conversation points

// COLUMN HEADERS FOR FILES
const movementHeaders = ['time', 'x', 'y']; // movement file headers, file should be of tyep number for each column
const conversationHeaders = ['time', 'speaker', 'talk']; // conversation file headers, file should be of type number, string and talk can be anything

// SAMPLE DATA formatted as: { directory, floorplan image, conversation File, movement File[], video platform, video params (see Video Player Interface) }
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

// FLOOR PLAN IMAGE
let inputFloorPlanPixelWidth, inputFloorPlanPixelHeight, displayFloorPlanWidth, displayFloorPlanHeight;

// VIDEO
let movie; // global holder for movie element--youtube, Kaltura and File Player coordinate around this
let videoPlayer; // instantiated in setupMovie method, used to manipulate video (play, pause, seek, etc.)
let videoIsPlaying = false; // boolean for video playing or stopped
let videoIsShowing = false; // boolean for showing/hiding video
let videoWidth, videoHeight; // width and height of video

// GUI
let updateMovementData = false; // controls accepting first input file to trigger update data processing
let totalTimeInSeconds = 0; // global time value that all data corresponds to, dynamically set and updated in processMovementFiles
const PLAN = 0,
    SPACETIME = 1; // constants to indicate plan or space-time views
let movementKeyTitle = true;
let conversationPositionTop = false; // controls positioning of conversation turns on path or top of screen
let allConversation = true; // shows all speaker turns on path, set to true for example 1 currently
let showIntroMsg = true; // sets intro message to start program
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
    tickHeight = 20;
let currPixelTimeMin, currPixelTimeMax;
let yPosTimeScaleTop, yPosTimeScaleBottom, yPosTimeScaleSize;
let timelineStart, timelineEnd, timelineHeight, timelineLength;
// BUTTONS
const button_1 = "Animate",
    button_2 = "Align Talk",
    button_3 = "All Talk",
    button_4 = "Video",
    button_5 = "How to Use";
let keyTextSize, titleTextSize, infoTextSize;
let textBoxWidth, textSpacing, boxSpacing, boxDistFromRect;

// MESSAGES
const introMSG = "INTERACTION GEOGRAPHY SLICER (IGS) INDOOR\n\nby Ben Rydal Shapiro & contributers\nbuilt with p5.js & JavaScript\n\nHi There! This is a tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan view (left) and a space-time view (right), where the vertical axis corresponds to the vertical dimension of the floor plan. Use the top menu to visualize different sample datasets or upload your own data. Hover over the floor plan and use the timeline to selectively study displayed data. Use the bottom buttons to animate data, visualize conversation in different ways, and interact with video data by clicking the timeline to play & pause video.\n\nTo format your data for use in this tool visit: benrydal.com/software/igs-indoor";
/*
Relationship between speaker and path objects can be 1:1 but does not have to be this allows variation 
in different types of data inputs (e.g., less or more movement files than speakers or vice versa)
*/

// Speaker holds data for each individual speaker marked in conversation file
class Speaker {
    constructor(sName, sCol) {
        this.name = sName;
        this.color = sCol;
        this.show = true;
    }
}

// Holds individual's movement marked in movement file and associated data
class Path {
    constructor(pathName, pathColor) {
        this.movement = []; // Point_Movement objects
        this.conversation = []; // Point_Conversation objects
        this.show = true;
        this.name = pathName;
        this.color = pathColor;
    }
}

// Holds data for each row/case in movement data files
class Point_Movement {
    constructor(xPos, yPos, time) {
        this.xPos = xPos;
        this.yPos = yPos;
        this.time = time;
    }
}

// Holds data for each row/case in conversation data file combined with movement data file
class Point_Conversation {
    constructor(xPos, yPos, time, speaker, talkTurn) {
        this.xPos = xPos; // derived from movement file
        this.yPos = yPos; // derived from movement file
        this.time = time;
        this.speaker = speaker;
        this.talkTurn = talkTurn;
    }
}

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