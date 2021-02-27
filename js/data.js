// FILE & DATA VARIABLES
let floorPlan; // holds floor plan image for display
let movementFiles = []; // holds movement files, globally important for dynamic file loading
let conversationFileResults = []; // holds parsed conversation file, globally important for dynamic file loading
let speakerList = []; // holds speaker objects parsed from conversation file
let paths = []; // holds path objects for each unique set of movement and conversation points

// SAMPLE DATA { directory, floorplan image, conversation File, movement File[], video platform, video params (see Video Player Interface) }
const example_1 = ['data/example-1/', 'floorplan.png', 'conversation.csv', ['Teacher.csv'], 'Youtube', {
    videoId: 'Iu0rxb-xkMk'
}];
const example_2 = ['data/example-2/', 'floorplan.png', 'conversation.csv', ['Teacher.csv', 'Sean.csv', 'Mei.csv', 'Cassandra.csv', 'Nathan.csv'], 'Kaltura', {
    wid: '_1038472',
    uiconf_id: '33084471',
    entry_id: '1_9tp4soob'
}];

// MOVEMENT AND CONVERSATION CSV FILE HEADERS
const movementHeaders = ['time', 'x', 'y'];
const conversationHeaders = ['time', 'speaker', 'talk'];

// FLOOR PLAN IMAGE
let inputFloorPlanPixelWidth, inputFloorPlanPixelHeight, displayFloorPlanWidth, displayFloorPlanHeight;

// TIMELINE
let lockedLeft = false,
    lockedRight = false;
let selSpacing = 20,
    tickHeight = 20;
let currPixelTimeMin, currPixelTimeMax;
let yPosTimeScaleTop, yPosTimeScaleBottom, yPosTimeScaleSize;
let timelineStart, timelineEnd, timelineHeight, timelineLength;

// VIDEO
let movie; // global holder for movie element--youtube, Kaltura and File Player coordinate around this
let videoPlayer; // instantiated in setupMovie method, used to manipulate video (play, pause, seek, etc.)
let videoIsPlaying = false; // indicates if video is playing/stopped
let videoCurrTime = 0; // video current time in seconds
let videoWidthOnPause, videoHeightOnPause, videoWidthOnPlay, videoHeightOnPlay; // permanent video width/heights
let videoWidthPlayCounter, videoHeightPlayCounter; // allows for transition between video width/heights
let videoTransitionCounter = 40; // speed of video size transitions

// GUI
let updateData = false; // controls accepting first input file to trigger update data processing
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
const speakerColorList = ['#ff7f00', '#1f78b4', '#cab2d6', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#a6cee3', '#b2df8a', '#6a3d9a', '#ffff99', '#b15928']; // 11 colors
const colorGray = 150,
    pathWeight = 3,
    basePathColor = 100; // for paths that don't have associated speaker in speakerList
let animationCounter = 0; // controls animation
let animation = true,
    videoMode = false,
    howToRead = false;
// 5 Buttons correspond to modes
let button_1 = "Animate",
    button_2 = "Align Talk",
    button_3 = "All Talk on Path",
    button_4 = "Video",
    button_5 = "How to Read";
let keyTextSize, titleTextSize, infoTextSize;
let textBoxWidth, textSpacing, boxSpacing, boxDistFromRect;

// MESSAGES
// Buttons
let introMSG = "Press this button to learn how to read and interact with this visualization";
let howToReadMSG_1 = "The left view shows the teachers movement over a floor plan of an eigth grade classroom. The right view shows the teachers movement over a timeline where the vertical axis corresponds with the vertical dimension of the floor plan.";
let howToReadMSG_2 = "Hover over buttons to learn how to interact with this visualization. Use the timeline to select and rescale data.";
let animateMSG = "Press this button to animate movement and conversation over space and time";
let conversation_1_MSG = "Press this button and the colored speaker buttons above to view different conversation turns along the teacher's movement path. Hover over each conversation turn to read each turn. Turns are coded in the following manner: Teacher, Student (a single student), Student New (a new student whose identity differs from the last student to speak), Many Students, the Whole Class, and non-members of the class (e.g., PA system).";
let conversation_2_MSG = "Press this button to view and read all conversation aligned horizontally.";
let videoMSG = "Press this button to watch video from this classroom discussion. Click anywhere on the timeline to play and pause video.";
// Title
let titleMsg = "Classroom Interaction Geography";
let infoMsg = "Interaction Geography Slicer (IGS) description....";


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