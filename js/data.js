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
const example_2 = ['data/example-2/', 'floorplan.png', 'conversation.csv', ['Teacher.csv', 'Sean.csv', 'Mei.csv', 'Cassandra.csv', 'Nathan.csv'], 'Kaltura', {
    wid: '_1038472',
    uiconf_id: '33084471',
    entry_id: '1_9tp4soob'
}];

// FLOOR PLAN IMAGE
let inputFloorPlanPixelWidth, inputFloorPlanPixelHeight, displayFloorPlanWidth, displayFloorPlanHeight;

// VIDEO
let movie; // global holder for movie element--youtube, Kaltura and File Player coordinate around this
let videoPlayer; // instantiated in setupMovie method, used to manipulate video (play, pause, seek, etc.)
let videoIsPlaying = false; // indicates if video is playing/stopped
let videoCurrTime = 0; // video current time in seconds
let videoWidthOnPause, videoHeightOnPause, videoWidthOnPlay, videoHeightOnPlay; // permanent video width/heights
let videoWidthPlayCounter, videoHeightPlayCounter; // allows for transition between video width/heights
let videoTransitionCounter = 40; // speed of video size transitions

// GUI
let updateMovementData = false; // controls accepting first input file to trigger update data processing
let totalTimeInSeconds = 0; // global time value that all data corresponds to, dynamically set and updated in processMovementFiles
const PLAN = 0,
    SPACETIME = 1; // constants to indicate plan or space-time views
let movementKeyTitle = true;
let conversationPositionTop = false; // controls positioning of conversation turns on path or top of screen
let allConversation = false; // controls showing all or matching speaker conversation turns on path
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
    videoMode = false,
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
let howToMSG = "Hi There! This is a beta version of the Interaction Geography Slicer. You can use this tool to visualize movement, conversation, and video data over space and time. Use the top menu to visualize different sample datasets and upload your data. Movement and conversation are shown over a floor plan view (left) and a space-time view (right), where the vertical axis corresponds to the vertical dimension of the floor plan. Hover over buttons on the left to learn about interactive features of this tool.";
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