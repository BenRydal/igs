class Core {

    constructor() {
        // DATA
        /**
         * Movement and conversation file results arrays allow dynamic re-processing of individual data files
         */
        this.movementFileResults = []; // List that holds a results array and character letter indicating path name from a parsed movement .CSV file
        this.conversationFileResults = []; // List that holds a results array and file data from a parsed conversation .CSV file
        this.speakerList = []; // List that holds Speaker objects parsed from conversation file
        this.paths = []; // List that holds path objects for each unique set of movement and conversation points constructed from parsed conversation and movement .CSV files
        this.floorPlan = null; // PNG or JPG core.core.floorPlan image
        // MODES
        this.isModeMovement = true; // boolean controls whether movement or conversation keys show
        this.isModeAnimate = false; // boolean controls positioning of conversation turns on path or top of screen
        this.isModeAlignTalkTop = false; // boolean controls whether single speaker or all conversation turns shown on path
        this.isModeAllTalkOnPath = true; // boolean controls core.isModeAnimate mode
        this.isModeIntro = true; // boolean controls intro message
        this.isModeVideoPlaying = false; // boolean indicating video is playing
        this.isModeVideoShowing = false; // boolean indicating video is showing in GUI
        // MISC
        this.animationCounter = 0; // counter to synchronize animation across all data
        this.bugTimePosForVideoScrubbing = null; // Set in draw movement data and used to display correct video frame when scrubbing video
        this.inputFloorPlanPixelWidth = null;
        this.inputFloorPlanPixelHeight = null; // Number indicating pixel width/height of user inputted floor plan image file
        this.totalTimeInSeconds = 0; // Number indicating time value in seconds that all displayed data is set to, set dynamically in processMovement methods
    }
}

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