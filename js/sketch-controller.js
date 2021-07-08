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

    updateLoop() {
        if (this.mode.isAnimate || this.mode.isVideoPlay) loop();
        else noLoop();
    }

    startLoop() {
        loop();
    }

    overLoadFloorPlanButton(fileLocation) {
        core.updateFloorPlan(fileLocation);
    }

    overLoadMovementButton(fileList) {
        processData.parseMovementFiles(fileList);
    }

    overLoadConversationButton(file) {
        processData.parseConversationFile(file); // parse converted file
    }

    overLoadVideoButton(fileLocation) {
        core.updateVideo('File', {
            fileName: fileLocation
        });
    }

    overVideoButton() {
        if (testData.dataIsLoaded(core.videoPlayer)) this.toggleVideoShowHide();
    }

    overAnimateButton() {
        if (this.mode.isAnimate) this.animationCounter = this.mapFromPixelToTotalTime(keys.timeline.selectEnd);
        else this.animationCounter = this.mapFromPixelToTotalTime(keys.timeline.selectStart);
        this.setIsAnimate(!this.mode.isAnimate);
    }

    handleMousePressed() {
        if (this.testVideoToPlay()) this.playPauseMovie();
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

    updateAnimation() {
        if (this.mode.isAnimate) {
            const animationIncrementRateDivisor = 1000; // this divisor seems to work best
            const curTimeIntervalInSeconds = this.mapFromPixelToTotalTime(keys.timeline.selectEnd) - this.mapFromPixelToTotalTime(keys.timeline.selectStart); // Get amount of time in seconds currently displayed
            const animationIncrementValue = curTimeIntervalInSeconds / animationIncrementRateDivisor; // set increment value based on that value/divisor to keep constant sketchController.mode.isAnimate speed regardless of time interval selected
            if (sketchController.animationCounter < this.mapFromPixelToTotalTime(keys.timeline.selectEnd)) sketchController.animationCounter += animationIncrementValue;
            else sketchController.setIsAnimate(false);
        }
    }

    updateVideoDisplay() {
        if (this.mode.isVideoShow) {
            core.videoPlayer.updatePos(mouseX, mouseY, 100);
            if (!this.mode.isVideoPlay) this.setVideoScrubbing();
        }
    }

    setVideoScrubbing() {
        if (this.mode.isAnimate) {
            const vPos = Math.floor(map(sketchController.bugTimeForVideoScrub, keys.timeline.start, keys.timeline.end, this.mapFromPixelToVideoTime(keys.timeline.selectStart), this.mapFromPixelToVideoTime(keys.timeline.selectEnd)));
            core.videoPlayer.seekTo(vPos);
        } else if (keys.overSpaceTimeView(mouseX, mouseY)) {
            const vPos = Math.floor(this.mapFromPixelToVideoTime(this.mapFromPixelToSelectedTime(mouseX)));
            core.videoPlayer.seekTo(vPos);
            core.videoPlayer.pause(); // Add to prevent accidental video playing that seems to occur
        }
    }

    toggleVideoShowHide() {
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


    playPauseMovie() {
        if (this.mode.isVideoPlay) {
            core.videoPlayer.pause();
            this.setVideoPlay(false);
        } else {
            const tPos = this.mapFromPixelToVideoTime(this.mapFromPixelToSelectedTime(mouseX));
            core.videoPlayer.play();
            core.videoPlayer.seekTo(tPos);
            this.setVideoPlay(true);
        }
    }

    loadUserData() {
        this.setIntro(false); // Hide intro msg if showing
        core.clearAllData();
    }
    /**
     * @param  {[String directory, String floorPlan image file, String conversation File, String movement File[], String video platform, video params (see Video Player Interface)]} params
     */
    loadExampleData(params) {
        this.setIntro(false); // Hide intro msg if showing
        core.updateVideo(params[4], params[5]);
        core.updateFloorPlan(params[0] + params[1]);
        processData.parseExampleData(params);
    }

    getScaledPointValues(point, view) {
        const pixelTime = map(point.time, 0, core.totalTimeInSeconds, keys.timeline.start, keys.timeline.end);
        const scaledTime = map(pixelTime, keys.timeline.selectStart, keys.timeline.selectEnd, keys.timeline.start, keys.timeline.end);
        const scaledXPos = point.xPos * keys.floorPlan.width / core.floorPlan.inputPixelWidth;
        const scaledYPos = point.yPos * keys.floorPlan.height / core.floorPlan.inputPixelHeight;
        let scaledSpaceTimeXPos;
        if (view === PLAN) scaledSpaceTimeXPos = scaledXPos;
        else if (view === SPACETIME) scaledSpaceTimeXPos = scaledTime;
        else scaledSpaceTimeXPos = NO_DATA;
        return {
            pixelTime,
            scaledTime,
            scaledXPos,
            scaledYPos,
            scaledSpaceTimeXPos
        };
    }

    /**
     * @param  {Number/Float} timeValue
     */
    testAnimation(value) {
        if (sketchController.mode.isAnimate) return this.animationCounter > this.mapFromPixelToTotalTime(value);
        else return true;
    }


    testMovementPointToDraw(curPoint) {
        return keys.overTimeline(curPoint.pixelTime) && keys.overFloorPlan(curPoint.scaledXPos, curPoint.scaledYPos) && this.testAnimation(curPoint.pixelTime);
    }
    /**
     * Test if point is in user view
     * @param  {ConversationPoint} curPoint
     */
    testConversationPointToDraw(curPoint) {
        return keys.overTimeline(curPoint.pixelTime) && keys.overFloorPlan(curPoint.scaledXPos, curPoint.scaledYPos) && this.testAnimation(curPoint.pixelTime) && keys.overFloorPlanAndCursor(curPoint.scaledXPos, curPoint.scaledYPos);
    }

    testVideoToPlay() {
        return testData.dataIsLoaded(core.videoPlayer) && this.mode.isVideoShow && !this.mode.isAnimate && keys.overRect(keys.timeline.start, 0, keys.timeline.end, keys.timeline.bottom)
    }
    // map to inverse, values constrained between 10 and 1 (pixels)
    mapConversationRectRange() {
        return map(core.totalTimeInSeconds, 0, 3600, 10, 1, true)
    }

    mapFromPixelToTotalTime(value) {
        return map(value, keys.timeline.start, keys.timeline.end, 0, core.totalTimeInSeconds);
    }

    mapFromTotalToPixelTime(value) {
        return map(value, 0, core.totalTimeInSeconds, keys.timeline.start, keys.timeline.end);
    }

    mapFromPixelToVideoTime(value) {
        return Math.floor(map(value, keys.timeline.start, keys.timeline.end, 0, Math.floor(core.videoPlayer.getVideoDuration()))); // must floor vPos to prevent double finite error
    }

    mapFromPixelToSelectedTime(value) {
        return map(value, keys.timeline.start, keys.timeline.end, keys.timeline.selectStart, keys.timeline.selectEnd);
    }

    mapFromVideoToSelectedTime() {
        const timelinePos = map(core.videoPlayer.getCurrentTime(), 0, core.totalTimeInSeconds, keys.timeline.start, keys.timeline.end);
        return map(timelinePos, keys.timeline.selectStart, keys.timeline.selectEnd, keys.timeline.start, keys.timeline.end);
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
}