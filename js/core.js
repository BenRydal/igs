class Core {

    constructor() {
        // FILES
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