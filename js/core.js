class Core {

    constructor() {
        // CORE DATA VARIABLES
        // Movement and conversation file results arrays allow dynamic re-processing of individual data files
        this.movementFileResults = []; // List that holds a results array and character letter indicating path name from a parsed movement .CSV file
        this.conversationFileResults = []; // List that holds a results array and file data from a parsed conversation .CSV file
        this.speakerList = []; // List that holds Speaker objects parsed from conversation file
        this.paths = []; // List that holds path objects for each unique set of movement and conversation points constructed from parsed conversation and movement .CSV files
        this.floorPlan = null; // PNG or JPG core.core.floorPlan image
        // CORE MODES
        this.isModeMovement = true; // boolean controls whether movement or conversation keys show
        this.isModeAnimate = false; // boolean controls positioning of conversation turns on path or top of screen
        this.isModeAlignTalkTop = false; // boolean controls whether single speaker or all conversation turns shown on path
        this.isModeAllTalkOnPath = true; // boolean controls core.isModeAnimate mode
        this.isModeIntro = true; // boolean controls intro message
        this.isModeVideoPlaying = false; // boolean indicating video is playing
        this.isModeVideoShowing = false; // boolean indicating video is showing in GUI
        // CORE MISC VARIABLES
        this.animationCounter = 0; // counter to synchronize animation across all data
        this.bugTimePosForVideoScrubbing = null; // Set in draw movement data and used to display correct video frame when scrubbing video
        this.inputFloorPlanPixelWidth = null;
        this.inputFloorPlanPixelHeight = null; // Number indicating pixel width/height of user inputted floor plan image file
        this.totalTimeInSeconds = 0; // Number indicating time value in seconds that all displayed data is set to, set dynamically in processMovement methods
    }

    /**
     * CORE DATA FACTORY FUNCTIONS
     * Speaker and Path objects are separate due to how shapes are drawn in browser on Canvas element.
     * Each speaker and path object can match/correspond to the same person but can also vary to
     * allow for different number of movement files and speakers.
     */

    /**
     * Factory function that creates a Speaker object
     * @param  {char} name // name of speaker
     * @param  {color} color // color of speaker
     * @param  {boolean} show // if speaker is showing in GUI
     */
    createSpeaker(name, color, show) {
        return {
            name,
            color,
            show
        };
    }

    /**
     * Factory function that creates a speaker Path object
     * @param  {char} name // Name of Path. Matches 1st letter of CSV file
     * @param  {MovementPoint []} movement // Path is comprised of 2 arrays of MovementPoint and ConversationPoint objects
     * @param  {ConversationPoint []} conversation
     * @param  {color} color // color of Path
     * @param  {boolean} show // if speaker is showing in GUI
     */
    createPath(name, movement, conversation, color, show) {
        return {
            name,
            movement,
            conversation,
            color,
            show
        }
    }

    /**
     * Object constructed from .CSV movement file representing a location in space and time along a path
     * @param  {Number} xPos // x and y pixel positions on floor plan
     * @param  {Number} time // time value in seconds
     */
    createMovementPoint(xPos, yPos, time) {
        return {
            xPos,
            yPos,
            time
        }
    }

    /**
     * Object constructed from .CSV movement AND conversation files representing a location
     * in space and time and String values of a single conversation turn
     * @param  {Number} xPos // x and y pixel positions on floor plan
     * @param  {Number} yPos
     * @param  {Number} time // Time value in seconds
     * @param  {String} speaker // Name of speaker
     * @param  {String} talkTurn // Text of conversation turn
     */
    createConversationPoint(xPos, yPos, time, speaker, talkTurn) {
        return {
            xPos,
            yPos,
            time,
            speaker,
            talkTurn
        }
    }

    clearAllData() {
        loop(); // rerun P5 draw loop
        if (testData.dataIsLoaded(videoPlayer)) {
            if (this.isModeVideoShowing) keys.overVideoButton(); // Turn off video before destroying it if showing
            videoPlayer.destroy(); // if there is a video, destroy it
            videoPlayer = null; // set videoPlayer to null
        }
        this.floorPlan = null;
        this.clearConversationData();
        this.clearMovementData();
    }

    clearConversationData() {
        this.conversationFileResults = [];
        this.speakerList = [];
        this.paths = [];
    }

    clearMovementData() {
        this.movementFileResults = [];
        this.paths = [];
        this.totalTimeInSeconds = 0; // reset total time
    }
}