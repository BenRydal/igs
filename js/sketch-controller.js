/*
IGS (move core booleans here with getters/setters)
- core (holds program data and update methods)
- processData (handles parsing/processing of CSVs)
- keys (GUI position vars, draw methods)
- p5controller? (boolean modes, handlers)
- drawData (testSketch?)

Controller

TestData

TODO: update parameters in all data calls, textFont/textSize?
Move videoIsShowing/playing and overvideobutton into videoPlayer?

    // all the "set methods" THEN p5 sketch itself deals with all the mouse handling??
    // setters/getters still all in here SO this is where things change and sketch is where flow is handled

    // NEED getters/setters for all modes!--COULD have one for array?
    // COULD pass keys object/videoPlayer reference to all of these methods???
*/

class SketchController {

    constructor() {
        // TODO: REMOVE isMovement Mode!!! Just for key display
        this.mode = {
            isMovement: true,
            isAnimate: false,
            isAlignTalk: false,
            isAllTalk: true,
            isIntro: true,
            isVideoPlay: false,
            isVideoShow: false
        }
        this.animationCounter = 0; // counter to synchronize animation across all data
        this.bugTimePosForVideoScrubbing = null; // Set in draw movement data and used to display correct video frame when scrubbing video

    }

    setIsAnimate(value) {
        this.mode.isAnimate = value;
    }

    setAlignTalk(value) {
        this.mode.isAlignTalk = value;
    }

    setAllTalk(value) {
        this.mode.isAllTalk = value;
    }

    setIntro(value) {
        this.mode.isIntro = value;
    }

    handleMousePressed() {
        // Controls video when clicking over timeline region
        if (this.mode.isVideoShow && !this.mode.isAnimate && keys.overRect(keys.timeline.start, 0, keys.timeline.end, keys.timeline.bottom)) this.playPauseMovie();
        keys.overMovementConversationButtons();
        if (this.mode.isMovement) keys.overPathKeys();
        else keys.overSpeakerKeys();
    }

    handleMouseDragged() {
        if (!this.mode.isAnimate && ((keys.timeline.isLockedLeft || keys.timeline.isLockedRight) || keys.overRect(keys.timeline.start - keys.timeline.padding, keys.timeline.top, keys.timeline.length + keys.timeline.padding, keys.timeline.thickness))) keys.handleTimeline();

    }

    handleMouseReleased() {
        keys.timeline.isLockedLeft = false;
        keys.timeline.isLockedRight = false;
    }

    /**
     * Toggle on and off this.mode.isAnimate mode and set/end global this.mode.isAnimate counter variable
     */
    overAnimateButton() {
        if (this.mode.isAnimate) this.animationCounter = map(keys.timeline.selectEnd, keys.timeline.start, keys.timeline.end, 0, core.totalTimeInSeconds); // set to keys.timeline.selectEnd mapped value
        else this.animationCounter = map(keys.timeline.selectStart, keys.timeline.start, keys.timeline.end, 0, core.totalTimeInSeconds); // set to keys.timeline.selectStart mapped value
        this.setIsAnimate(!this.mode.isAnimate);
    }

    /**
     * Updates animation mode variable depending on animation state
     */
    checkAnimation() {
        const animationIncrementRateDivisor = 1000; // this divisor seems to work best
        // Get amount of time in seconds currently displayed
        const curTimeIntervalInSeconds = map(keys.timeline.selectEnd, keys.timeline.start, keys.timeline.end, 0, core.totalTimeInSeconds) - map(keys.timeline.selectStart, keys.timeline.start, keys.timeline.end, 0, core.totalTimeInSeconds);
        // set increment value based on that value/divisor to keep constant sketchController.mode.isAnimate speed regardless of time interval selected
        const animationIncrementValue = curTimeIntervalInSeconds / animationIncrementRateDivisor;
        if (sketchController.animationCounter < map(keys.timeline.selectEnd, keys.timeline.start, keys.timeline.end, 0, core.totalTimeInSeconds)) sketchController.animationCounter += animationIncrementValue;
        else sketchController.setIsAnimate(false);
    }

    /**
     * Toggle whether video is playing and whether video is showing
     * NOTE: this is different than playPauseMovie method
     */
    overVideoButton() {
        if (this.mode.isVideoShow) {
            core.videoPlayer.pause();
            core.videoPlayer.hide();
            this.mode.isVideoPlay = false; // important to set this
        } else {
            core.videoPlayer.show();
        }
        this.mode.isVideoShow = !this.mode.isVideoShow; // set after testing
    }

    /**
     * Plays/pauses movie and updates videoPlayhead if setting to play
     * Also toggles global this.mode.isVideoPlay variable
     */
    playPauseMovie() {
        if (this.mode.isVideoPlay) {
            core.videoPlayer.pause();
            this.mode.isVideoPlay = false;
        } else {
            // first map mouse to selected time values in GUI
            const mapMousePos = map(mouseX, keys.timeline.start, keys.timeline.end, keys.timeline.selectStart, keys.timeline.selectEnd);
            // must floor vPos to prevent double finite error
            const videoPos = Math.floor(map(mapMousePos, keys.timeline.start, keys.timeline.end, 0, Math.floor(core.videoPlayer.getVideoDuration())));
            core.videoPlayer.play();
            core.videoPlayer.seekTo(videoPos);
            this.mode.isVideoPlay = true;
        }
    }

    loadUserData() {
        this.checkSettings();
        core.clearAllData();
    }
    /**
     * @param  {[String directory, String floorPlan image file, String conversation File, String movement File[], String video platform, video params (see Video Player Interface)]} params
     */
    loadExampleData(params) {
        this.checkSettings();
        core.updateVideo(params[4], params[5]);
        core.updateFloorPlan(params[0] + params[1]);
        processData.parseExampleData(params);
    }

    checkSettings() {
        if (this.mode.isVideoShow) this.overVideoButton(); // Turn off video that if showing
        this.mode.isIntro = false; // Hide intro msg if showing
    }
}