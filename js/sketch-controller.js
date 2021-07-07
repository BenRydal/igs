// setters/getters still all in here SO this is where things change and sketch is where flow is handled
// COULD pass keys object/videoPlayer reference to all of these methods???
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
        this.bugTimeForVideoScrub = null; // Set in draw movement data and used to display correct video frame when scrubbing video
    }

    // TODO: Add GETTERS
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

    setVideoPlay(value) {
        this.mode.isVideoPlay = value;
    }

    setVideoShow(value) {
        this.mode.isVideoShow = value;
    }

    mapFromPixelToTotalTime(value) {
        return map(value, keys.timeline.start, keys.timeline.end, 0, core.totalTimeInSeconds);
    }

    mapFromPixelToVideoTime(value) {
        return map(value, keys.timeline.start, keys.timeline.end, 0, Math.floor(core.videoPlayer.getVideoDuration())); // must floor vPos to prevent double finite error
    }

    mapFromPixelToSelectedTime(value) {
        return map(value, keys.timeline.start, keys.timeline.end, keys.timeline.selectStart, keys.timeline.selectEnd);
    }

    handleMousePressed() {
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
     * @param  {Number/Float} timeValue
     */
    testAnimation(value) {
        if (sketchController.mode.isAnimate) return this.animationCounter > this.mapFromPixelToTotalTime(value);
        else return true;
    }

    /**
     * Test if point is in user view
     * @param  {ConversationPoint} curPoint
     */
    testConversationPointToDraw(curPoint) {
        return keys.overTimeline(curPoint.pixelTime) && keys.overFloorPlan(curPoint.scaledXPos, curPoint.scaledYPos) && this.testAnimation(curPoint.pixelTime) && keys.overFloorPlanAndCursor(curPoint.scaledXPos, curPoint.scaledYPos);
    }

    /**
     * Toggle on and off this.mode.isAnimate mode and set/end global this.mode.isAnimate counter variable
     */
    overAnimateButton() {
        if (this.mode.isAnimate) this.animationCounter = this.mapFromPixelToTotalTime(keys.timeline.selectEnd);
        else this.animationCounter = this.mapFromPixelToTotalTime(keys.timeline.selectStart);
        this.setIsAnimate(!this.mode.isAnimate);
    }

    /**
     * Updates animation mode variable depending on animation state
     */
    updateAnimation() {
        const animationIncrementRateDivisor = 1000; // this divisor seems to work best
        const curTimeIntervalInSeconds = this.mapFromPixelToTotalTime(keys.timeline.selectEnd) - this.mapFromPixelToTotalTime(keys.timeline.selectStart); // Get amount of time in seconds currently displayed
        const animationIncrementValue = curTimeIntervalInSeconds / animationIncrementRateDivisor; // set increment value based on that value/divisor to keep constant sketchController.mode.isAnimate speed regardless of time interval selected
        if (sketchController.animationCounter < this.mapFromPixelToTotalTime(keys.timeline.selectEnd)) sketchController.animationCounter += animationIncrementValue;
        else sketchController.setIsAnimate(false);
    }

    updateVideoDisplay() {
        if (this.mode.isVideoShow) {
            core.videoPlayer.updatePos(mouseX, mouseY, 100);
            if (!this.mode.isVideoPlay) this.setVideoScrubbing();
        }
    }

    /**
     * Updates time selected in video depending on mouse position or sketchController.mode.isAnimate over timeline
     */
    setVideoScrubbing() {
        if (this.mode.isAnimate) {
            const vPos = Math.floor(map(sketchController.bugTimeForVideoScrub, keys.timeline.start, keys.timeline.end, this.mapFromPixelToVideoTime(keys.timeline.selectStart), this.mapFromPixelToVideoTime(keys.timeline.selectEnd)));
            core.videoPlayer.seekTo(vPos);
        } else if (keys.overRect(keys.timeline.start, 0, keys.timeline.end, keys.timeline.height)) {
            const vPos = Math.floor(this.mapFromPixelToVideoTime(this.mapFromPixelToSelectedTime(mouseX)));
            core.videoPlayer.seekTo(vPos);
            core.videoPlayer.pause(); // Add to prevent accidental video playing that seems to occur
        }
    }

    /**
     * Toggle whether video is playing and whether video is showing
     */
    overVideoButton() {
        if (this.mode.isVideoShow) {
            core.videoPlayer.pause();
            core.videoPlayer.hide();
            this.setVideoPlay(false);
            this.setVideoShow(false);
        } else {
            core.videoPlayer.show();
            this.setVideoShow(true);
        }
    }

    /**
     * Plays/pauses movie and updates videoPlayhead if setting to play
     */
    playPauseMovie() {
        if (this.mode.isVideoPlay) {
            core.videoPlayer.pause();
            this.setVideoPlay(false);
        } else {
            core.videoPlayer.play();
            core.videoPlayer.seekTo(Math.floor(this.mapFromPixelToVideoTime(this.mapFromPixelToSelectedTime(mouseX))));
            this.setVideoPlay(true);
        }
    }

    loadUserData() {
        this.updateSettingsOnLoad();
        core.clearAllData();
    }
    /**
     * @param  {[String directory, String floorPlan image file, String conversation File, String movement File[], String video platform, video params (see Video Player Interface)]} params
     */
    loadExampleData(params) {
        this.updateSettingsOnLoad();
        core.updateVideo(params[4], params[5]);
        core.updateFloorPlan(params[0] + params[1]);
        processData.parseExampleData(params);
    }

    updateSettingsOnLoad() {
        if (this.mode.isVideoShow) this.overVideoButton(); // Turn off video that if showing
        this.mode.isIntro = false; // Hide intro msg if showing
    }
}