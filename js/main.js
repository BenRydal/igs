/*
This data visualization uses an approach called interaction geography to revisit a complete classroom science lesson from the Third International Mathematics and Science Study (TIMSS). The original data shown in this visualization was collected by TIMSS researchers and teachers and generously made publicly available at the following website to advance international teaching practice and studies of classroom interaction: https://www.timssvideo.com. As described on this website, the TIMSS Study "is a follow-up and expansion of the TIMSS 1995 Video Study of mathematics teaching. Larger and more ambitious than the first, the 1999 study investigated eighth-grade science as well as mathematics, expanded the number of countries from three to seven, and included more countries with relatively high achievement on TIMSS assessments in comparison to the United States."

CREDITS/LICENSE INFORMATION: This software is  licensed under the GNU General Public License Version 2.0. See the GNU General Public License included with this software for more details. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details. Data used in accordance with policies described on the TIMSS Video Study website. IGS software originally developed by Ben Rydal Shapiro at Vanderbilt University as part of his dissertation titled Interaction Geography & the Learning Sciences. Copyright (C) 2018 Ben Rydal Shapiro, and contributers. To reference or read more about this work please see: https://etd.library.vanderbilt.edu/available/etd-03212018-140140/unrestricted/Shapiro_Dissertation.pdf
*/

// TO DO:
// Update var/let
// Figure out floor plan scaling
// then also update select region to be always if over map
// what if speakerList is 0?? e.g., how does getSpeakerObject work?
// basic error handling
// check animationMaxValue and video duration--how does program use/compare both
// test/fix use of initialValue for animation work

// ******* INPUT VARIABLES *******
let movementFiles = ['Teacher.csv', 'Student.csv']; // holds list of movement files, first letter of file is used to associate with speaker 
let conversationFile = "conversation.csv"; // 1 single conversation file
let mvmentColumnHeaders = ['time', 'x', 'y'];
let convoColumnHeaders = ['time', 'speaker', 'talk'];
let totalTimeInSeconds = 3353; // total time of all data including video
let floorplanPixelWidth = 1440 // width and height of floor plan image to scale data to floor plan correctly
let floorplanPixelHeight = 900;

// For videoPlatform 'Kaltura', videoParams expects 3 items, the wid, uiconf_id, and entry_id
// For videoPlatform 'Youtube', videoParams expects 1 item, the videoId
let videoPlatform = 'Youtube'; // what platform the video is being hosted on, specifies what videoPlayer should be instantiated during setupMovie
let videoParams = {
    videoId: 'Iu0rxb-xkMk'
};


//******* DATA *******
let dataTables = []; // holds # of files for data processing
let dataSamplingRate = 20; // rate movement data is sampled, increase to speed up program
let conversationTable; // holds conversation file
let conversationTableRowCount;
let turnCountPerSecond; // set in loadData based on conversation file
let speakerList = []; // Arraylist of speaker objects loaded from conversation file
let speakerColorList = ['#ff7f00', '#1f78b4', '#cab2d6', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#a6cee3', '#b2df8a', '#6a3d9a', '#ffff99', '#b15928']; // 11 colors
var paths = []; // holder for each person
var rowCounts = []; // list to sort max/min number of movement points in each path
var animationMaxValue;
var floorPlan, floorPlanWithKey; // floor plans
var PLAN = 0,
    SPACETIME = 1; // constants to indicate plan or space-time views
var timelineStart, timelineEnd, timelineHeight;
var bugTimePosForVideo; // to draw slicer line when video is playing
var animationCounter = 0; // controls animation
var bugPrecision, bugSize;
var pathWeight = 3;
let basePathColor = 100; // for paths that don't have associated speaker in speakerList

//******* GUI *******
let movementKeyTitle = true;
let conversationPositionTop = false; // controls positioning of conversation turns on path or top of screen
let allConversation = false; // controls showing all or matching speaker conversation turns on path
var intro = true; // sets intro message to start program
var font_PlayfairReg, font_PlayfairItalic, font_PlayfairBold, font_Lato;
var buttonSpacing, buttonWidth, speakerKeysHeight, buttonsHeight;
// 5 Modes
var animation = true,
    videoMode = false,
    howToRead = false;
// 5 Buttons correspond to modes
var button_1 = "Animate",
    button_2 = "Align Talk",
    button_3 = "All Talk on Path",
    button_4 = "Video",
    button_5 = "How to Read";
var keyTextSize, titleTextSize, infoTextSize;
var textBoxWidth, textSpacing, boxSpacing, boxDistFromRect;
// Timeline
var lockedLeft = false,
    lockedRight = false;
var selSpacing = 20;
var tickHeight = 20;
var currPixelTimeMin;
var currPixelTimeMax;
var yPosTimeScaleTop;
var yPosTimeScaleBottom;
var yPosTimeScaleSize;
var timelineLength;
var selectRegion = false; // for region selection on floor plan
var selectRegionCircleSize = 50;

//******* VIDEO *******
var videoIsPlaying = false; // indicates if video is playing/stopped
var videoCurrTime = 0; // video current time in seconds
var videoWidthOnPause, videoHeightOnPause, videoWidthOnPlay, videoHeightOnPlay; // permanent video width/heights
var videoWidthPlayCounter, videoHeightPlayCounter; // allows for transition between video width/heights
var videoTransitionCounter = 40; // speed of video size transitions
var videoPlayer; // instantiated in setupMovie method, used to manipulate video (play, pause, seek, etc.)

//******* MESSAGES *******
// Buttons
var introMSG = "Press this button to learn how to read and interact with this visualization";
var howToReadMSG_1 = "The left view shows the teachers movement over a floor plan of an eigth grade classroom. The right view shows the teachers movement over a timeline where the vertical axis corresponds with the vertical dimension of the floor plan.";
var howToReadMSG_2 = "Hover over buttons to learn how to interact with this visualization. Use the timeline to select and rescale data.";
var animateMSG = "Press this button to animate movement and conversation over space and time";
var conversation_1_MSG = "Press this button and the colored speaker buttons above to view different conversation turns along the teacher's movement path. Hover over each conversation turn to read each turn. Turns are coded in the following manner: Teacher, Student (a single student), Student New (a new student whose identity differs from the last student to speak), Many Students, the Whole Class, and non-members of the class (e.g., PA system).";
var conversation_2_MSG = "Press this button to view and read all conversation aligned horizontally.";
var videoMSG = "Press this button to watch video from this classroom discussion. Click anywhere on the timeline to play and pause video.";
// Title
var titleMsg = "Classroom Interaction Geography";
var infoMsg = "Interaction Geography Slicer (IGS) description....";


/*
Relationship between speaker and path objects can be 1:1 but does not have to be
this allows variation in different types of data inputs 
(e.g., less or more movement files than speakers or vice versa)
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
        this.color = pathColor
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
    conversationTable = loadTable('data/' + conversationFile, "header"); // load conversation file first
    for (let i = 0; i < movementFiles.length; i++) { // loop through all files in directory
        let fileName = 'data/' + movementFiles[i];
        let dataTable = loadTable(fileName, "header");
        dataTables.push(dataTable);
    }
    font_PlayfairReg = loadFont("data/fonts/PlayfairDisplay-Regular.ttf");
    font_PlayfairItalic = loadFont("data/fonts/PlayfairDisplay-Italic.ttf");
    font_Playfairbold = loadFont("data/fonts/PlayfairDisplay-Bold.ttf");
    font_Lato = loadFont("data/fonts/Lato-Light.ttf");
    floorPlan = loadImage("data/floorplan.png");
    // Set up the video element
    var movie = createDiv(); // create the div that will hold the video
    movie.id('moviePlayer');
    movie.style('display', 'none');
    setupMovie('moviePlayer', videoPlatform, videoParams); // set up the video player
}

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight, P2D);
    pixelDensity(displayDensity());
    textFont(font_Lato, 14);
    textAlign(LEFT, TOP);
    setData();
}

function draw() {
    setUpAnimation();
    image(floorPlan, 0, 0, width, height);
    var keys = new Keys();
    keys.drawKeys();
    var drawData = new DrawData();
    for (var i = 0; i < paths.length; i++) {
        var path = paths[i];
        if (path.show) drawData.setDrawData(path);
    }
    drawData.setConversationBubble();
    if (howToRead) overButtonsMSGS();
    if (videoMode) {
        updateVideoScrubbing();
        if (videoIsPlaying) increaseVideoSize();
        else decreaseVideoSize();
    }
    if (intro) drawIntroMSG(introMSG); // draw intro message on program start up until mouse is pressed
}

function setUpAnimation() {
    var initialValue = map(currPixelTimeMax, timelineStart, timelineEnd, 0, animationMaxValue);
    if (animationCounter < initialValue) animationCounter++; // updates animation
    else animation = false;
}