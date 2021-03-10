/*
CREDITS/LICENSE INFORMATION: This software is licensed under the GNU General Public License Version 2.0. See the GNU General Public License included with this software for more details. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details. IGS software originally developed by Ben Rydal Shapiro at Vanderbilt University as part of his dissertation titled Interaction Geography & the Learning Sciences. Copyright (C) 2018 Ben Rydal Shapiro, and contributers. To reference or read more about this work please see: https://etd.library.vanderbilt.edu/available/etd-03212018-140140/unrestricted/Shapiro_Dissertation.pdf
*/

// TO DO:
// Conversation table error handling what if speakerList is 0?? e.g., how does getSpeakerObject work?
// Add additional type error handling for processing csv files
// fix bug to always show last value if over to prevent blinking
// Remove some fonts
// dynamic line/turn thickness
// ISSUE with conversation/movement file joining (see sean numbers)
// Organize mouse functions/main draw loop
// correctly organize draw data file into parent class and 2 sub classes

// INPUT FILE & DATA VARIABLES
let floorPlan; // holds floor plan image
let movementFiles = []; // holds movement files, globally important for dynamic file loading
let conversationFileResults = []; // holds parsed conversation file, globally important for dynamic file loading
let speakerList = []; // holds speaker objects parsed from conversation file
let paths = []; // holds path objects for each unique set of movement and conversation points
const movementHeaders = ['time', 'x', 'y']; // movement file headers
const conversationHeaders = ['time', 'speaker', 'talk']; // conversation file headers

// SAMPLE DATA { directory, floorplan image, conversation File, movement File[], video platform, video params (see Video Player Interface) }
const example_1 = ['data/example-1/', 'floorplan.png', 'conversation.csv', ['Teacher.csv'], 'Youtube', {
    videoId: 'Iu0rxb-xkMk'
}];

const example_2 = ['data/example-2/', 'floorplan.png', 'conversation.csv', ['Teacher.csv', 'Sean.csv', 'Mei.csv', 'Cassandra.csv', 'Nathan.csv'], 'Youtube', {
    videoId: 'Iu0rxb-xkMk'
}];

const example_3 = ['data/example-3/', 'floorplan.png', 'conversation.csv', ['Jordan.csv'], 'Youtube', {
    videoId: 'iiMjfVOj8po'
}];

// const example_2 = ['data/example-2/', 'floorplan.png', 'conversation.csv', ['Teacher.csv', 'Sean.csv', 'Mei.csv', 'Cassandra.csv', 'Nathan.csv'], 'Kaltura', {
//     wid: '_1038472',
//     uiconf_id: '33084471',
//     entry_id: '1_9tp4soob'
// }];

// FLOOR PLAN IMAGE
let inputFloorPlanPixelWidth, inputFloorPlanPixelHeight, displayFloorPlanWidth, displayFloorPlanHeight;

// VIDEO
let movie; // global holder for movie element--youtube, Kaltura and File Player coordinate around this
let videoPlayer; // instantiated in setupMovie method, used to manipulate video (play, pause, seek, etc.)
let videoIsPlaying = false; // boolean for video playing or stopped
let videoIsShowing = false; // boolean for showing/hiding video
let vidWidthSmall, vidHeightSmall, vidWidthLarge, vidHeightLarge; // controls 2 different video sizes

// GUI
let updateMovementData = false; // controls accepting first input file to trigger update data processing
let totalTimeInSeconds = 0; // global time value that all data corresponds to, dynamically set and updated in processMovementFiles
const PLAN = 0,
    SPACETIME = 1; // constants to indicate plan or space-time views
let movementKeyTitle = true;
let conversationPositionTop = false; // controls positioning of conversation turns on path or top of screen
let allConversation = true; // shows all speaker turns on path, set to true for example 1 currently
let intro = true; // sets intro message to start program
let font_PlayfairReg, font_PlayfairItalic, font_PlayfairBold, font_Lato;
let buttonSpacing, buttonWidth, speakerKeysHeight, buttonsHeight;
let floorPlanSelectorSize = 50;
let bugPrecision, bugSize;
let bugTimePosForVideo; // to draw slicer line when video is playing
// purple, orange, green, blue, red, yellow, brown, lPurple, lOrange, lGreen, lBlue, lRed
const speakerColorList = ['#6a3d9a', '#ff7f00', '#33a02c', '#1f78b4', '#e31a1c', '#ffff99', '#b15928', '#cab2d6', '#fdbf6f', '#b2df8a', '#a6cee3', '#fb9a99'];
const colorGray = 150,
    pathWeight = 3,
    basePathColor = 100; // for paths that don't have associated speaker in speakerList
let animationCounter = 0; // controls animation
let animation = true,
    howToRead = false;
// TIMELINE
let lockedLeft = false,
    lockedRight = false;
let selSpacing = 20,
    tickHeight = 20;
let currPixelTimeMin, currPixelTimeMax;
let yPosTimeScaleTop, yPosTimeScaleBottom, yPosTimeScaleSize;
let timelineStart, timelineEnd, timelineHeight, timelineLength;
// BUTTONS
let button_1 = "Animate",
    button_2 = "Align Talk",
    button_3 = "All Talk",
    button_4 = "Video",
    button_5 = "How to Use";
let keyTextSize, titleTextSize, infoTextSize;
let textBoxWidth, textSpacing, boxSpacing, boxDistFromRect;

// MESSAGES
let introMSG = "Press this button to learn how to use this tool. Visit this link to learn how to format your data for use in this tool [insert]";
let howToMSG = "Hi There! This is a beta version of the Interaction Geography Slicer. You can use this tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan view (left) and a space-time view (right), where the vertical axis corresponds to the vertical dimension of the floor plan. Use the top menu to visualize different sample datasets or upload your data. Hover over buttons on the left to learn about interactive features of this tool.";
let animateMSG = "Press this button to animate movement and conversation over space and time";
let alignTalkMSG = "Press this button to view conversation turns aligned horizontally. Hover over each conversation turn to read each turn.";
let talkOnPathMSG = "Press this button to view all conversation turns along a single movement path. Hover over each conversation turn to read each turn.";
let videoMSG = "Press this button to watch video synced to visualizations. Click anywhere on the timeline to play and pause video.";
let infoMsg = "INTERACTION GEOGRAPHY SLICER (IGS-Indoor)\nby Ben Rydal Shapiro & contributers\nbuilt with p5.js";

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

// Loads fonts, floor plan, and CSV file into p5.Table objects so that they can manipulated later
function preload() {
    loadFonts();
    loadExample(example_1);
}

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight, P2D);
    frameRate(30);
    pixelDensity(displayDensity());
    textFont(font_Lato, 14);
    textAlign(LEFT, TOP);
    setGUI();
}

function draw() {
    background(255);
    image(floorPlan, 0, 0, displayFloorPlanWidth, displayFloorPlanHeight);
    let keys = new Keys();
    keys.drawKeys();
    let drawData = new DrawData();
    for (let i = 0; i < paths.length; i++) {
        if (paths[i].show) drawData.setDrawData(paths[i]);
    }
    drawData.setConversationBubble();
    if (howToRead) overButtonsMSGS();
    if (intro) drawKeyMSG(introMSG, true); // draw intro message on program start up until mouse is pressed
    if (animation) setUpAnimation();
    if (videoIsShowing && !videoIsPlaying) updateVideoScrubbing();
}

function setUpAnimation() {
    if (animationCounter < map(currPixelTimeMax, timelineStart, timelineEnd, 0, totalTimeInSeconds)) animationCounter++; // updates animation
    else animation = false;
}

function setGUI() {
    setBaseValues();
    setTextSizes();
    setConversationValues();
    setVideoValues();
}

function setBaseValues() {
    timelineStart = width * 0.4638;
    timelineEnd = width * 0.9638;
    timelineLength = timelineEnd - timelineStart;
    timelineHeight = height * .81;
    displayFloorPlanWidth = timelineStart - (width - timelineEnd);
    displayFloorPlanHeight = timelineHeight;
    currPixelTimeMin = timelineStart; // adjustable timeline values
    currPixelTimeMax = timelineEnd;
    yPosTimeScaleTop = timelineHeight - tickHeight;
    yPosTimeScaleBottom = timelineHeight + tickHeight;
    yPosTimeScaleSize = 2 * tickHeight;
    buttonSpacing = width / 71;
    buttonWidth = buttonSpacing;
    speakerKeysHeight = timelineHeight + (height - timelineHeight) / 4;
    buttonsHeight = timelineHeight + (height - timelineHeight) / 1.8;
    bugPrecision = 3;
    bugSize = width / 56;
}

function setTextSizes() {
    keyTextSize = width / 70;
    titleTextSize = width / 55;
    infoTextSize = width / 100;
}

function setConversationValues() {
    textBoxWidth = width / 3; // width of text and textbox drawn
    textSpacing = width / 57; // textbox leading
    boxSpacing = width / 141; // general textBox spacing variable
    boxDistFromRect = width / 28.2; // distance from text rectangle of textbox
}

function setVideoValues() {
    let video = select('#moviePlayer').position(timelineStart, 0); // position video in upper left corner on timeline
    vidWidthSmall = width / 5;
    vidHeightSmall = width / 6;
    vidWidthLarge = timelineLength;
    vidHeightLarge = yPosTimeScaleTop;
}