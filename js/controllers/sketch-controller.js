class SketchController {

    constructor(sketch) {
        this.sk = sketch;
        this.mode = {
            isAnimate: false,
            isAlignTalk: false,
            isAllTalk: true,
            isIntro: true,
            isVideoPlay: false,
            isVideoShow: false
        }
        this.handle3D = new Handle3D(this.sk);
        this.handleRotation = new HandleRotation(this.sk);
        this.animationCounter = 0; // counter to synchronize animation across all data
        this.bugTimeForVideoScrub = null; // Set in draw movement data and used to display correct video frame when scrubbing video
    }

    // ****** P5 HANDLERS ****** //
    updateLoop() {
        if (this.mode.isAnimate || this.mode.isVideoPlay || this.handle3D.getIsTransitioning()) this.sk.loop();
        else this.sk.noLoop();
    }

    handleMousePressed() {
        if (this.testVideoToPlay()) this.playPauseMovie();
        else this.sk.gui.dataPanel.organize(this.sk.HANDLEGUI, this.sk.core.pathList, this.sk.core.speakerList, this.sk.core.codeList);
    }

    handleMouseDragged() {
        if (!this.mode.isAnimate) this.sk.gui.timelinePanel.handle();
    }

    handleMouseReleased() {
        this.sk.gui.timelinePanel.resetLock();
    }

    handleToggle3D() {
        this.handle3D.toggleIsShowing();
        this.handle3D.setIsTransitioning(true);
        if (this.handle3D.getIsShowing()) this.setRotateRight(); // must rotate floor plan to make matching space-time view appear in both 2D and 3D
        else this.setRotateLeft();
        this.sk.loop();
    }

    // ****** UPDATE METHODS ****** //

    updateAnimationCounter() {
        if (this.mode.isAnimate) this.animationCounter = this.mapPixelTimeToTotalTime(this.sk.gui.timelinePanel.getSelectEnd());
        else this.animationCounter = this.mapPixelTimeToTotalTime(this.sk.gui.timelinePanel.getSelectStart());
        this.setIsAnimate(!this.mode.isAnimate);
    }

    updateAnimation() {
        if (this.mode.isAnimate) {
            const animationIncrementRateDivisor = 1000; // this divisor seems to work best
            const curTimeIntervalInSeconds = this.mapPixelTimeToTotalTime(this.sk.gui.timelinePanel.getSelectEnd()) - this.mapPixelTimeToTotalTime(this.sk.gui.timelinePanel.getSelectStart()); // Get amount of time in seconds currently displayed
            const animationIncrementValue = curTimeIntervalInSeconds / animationIncrementRateDivisor; // set increment value based on that value/divisor to keep constant sketchController.mode.isAnimate speed regardless of time interval selected
            if (this.animationCounter < this.mapPixelTimeToTotalTime(this.sk.gui.timelinePanel.getSelectEnd())) this.animationCounter += animationIncrementValue;
            else this.setIsAnimate(false);
        }
    }

    updateVideoDisplay() {
        if (this.mode.isVideoShow) {
            this.sk.videoPlayer.updatePos(this.sk.mouseX, this.sk.mouseY, 100); // third parameter is offset value
            if (!this.mode.isVideoPlay) this.setVideoScrubbing();
        }
    }

    setVideoScrubbing() {
        if (this.mode.isAnimate) this.sk.videoPlayer.seekTo(Math.floor(this.sk.map(this.bugTimeForVideoScrub, this.sk.gui.timelinePanel.getStart(), this.sk.gui.timelinePanel.getEnd(), this.mapPixelTimeToVideoTime(this.sk.gui.timelinePanel.getSelectStart()), this.mapPixelTimeToVideoTime(this.sk.gui.timelinePanel.getSelectEnd()))));
        else if (this.sk.gui.timelinePanel.aboveTimeline(this.sk.mouseX, this.sk.mouseY)) {
            this.sk.videoPlayer.seekTo(Math.floor(this.mapPixelTimeToVideoTime(this.mapPixelTimeToSelectTime(this.sk.mouseX))));
            this.sk.videoPlayer.pause(); // Add to prevent accidental video playing that seems to occur
        }
    }

    toggleVideoShowHide() {
        if (this.mode.isVideoShow) {
            this.sk.videoPlayer.pause();
            this.sk.videoPlayer.hide();
            this.setIsVideoPlay(false);
            this.setIsVideoShow(false);
        } else {
            this.sk.videoPlayer.show();
            this.setIsVideoShow(true);
        }
    }

    playPauseMovie() {
        if (this.mode.isVideoPlay) {
            this.sk.videoPlayer.pause();
            this.setIsVideoPlay(false);
        } else {
            this.sk.videoPlayer.play();
            this.sk.videoPlayer.seekTo(this.mapPixelTimeToVideoTime(this.mapPixelTimeToSelectTime(this.sk.mouseX)));
            this.setIsVideoPlay(true);
        }
    }

    translationComplete() {
        return this.handle3D.getIsShowing() || this.handle3D.getIsTransitioning();
    }

    update3DSlicerRect() {
        this.sk.gui.timelinePanel.draw3DSlicerRect(this.sk.gui.fpContainer.getContainer(), this.mapToSelectTimeThenPixelTime(this.sk.mouseX)); // pass mapped mouseX as zPos
    }

    setFloorPlan() {
        this.handleRotation.setFloorPlan(this.sk.gui.fpContainer.getContainer());
    }

    // ****** TEST HELPERS ****** //
    testVideoToPlay() {
        return this.testVideoAndDivAreLoaded() && this.mode.isVideoShow && !this.mode.isAnimate && this.sk.gui.timelinePanel.aboveTimeline(this.sk.mouseX, this.sk.mouseY);
    }

    testVideoAndDivAreLoaded() {
        return (this.sk.dataIsLoaded(this.sk.videoPlayer) && this.sk.videoPlayer.getIsLoaded());
    }

    // ****** MAP HELPERS ****** //

    mapVideoTimeToSelectedTime() {
        const timelinePos = this.mapTotalTimeToPixelTime(this.sk.videoPlayer.getCurrentTime());
        return this.mapSelectTimeToPixelTime(timelinePos);
    }

    mapPixelTimeToTotalTime(value) {
        return this.sk.map(value, this.sk.gui.timelinePanel.getStart(), this.sk.gui.timelinePanel.getEnd(), 0, this.sk.core.totalTimeInSeconds);
    }

    mapPixelTimeToVideoTime(value) {
        return Math.floor(this.sk.map(value, this.sk.gui.timelinePanel.getStart(), this.sk.gui.timelinePanel.getEnd(), 0, Math.floor(this.sk.videoPlayer.getVideoDuration()))); // must floor vPos to prevent double finite error
    }

    mapPixelTimeToSelectTime(value) {
        return this.sk.map(value, this.sk.gui.timelinePanel.getStart(), this.sk.gui.timelinePanel.getEnd(), this.sk.gui.timelinePanel.getSelectStart(), this.sk.gui.timelinePanel.getSelectEnd());
    }

    mapToSelectTimeThenPixelTime(value) {
        return this.mapSelectTimeToPixelTime(this.mapPixelTimeToSelectTime(value));
    }

    mapSelectTimeToPixelTime(value) {
        if (this.handle3D.getIsShowing()) return this.sk.map(value, this.sk.gui.timelinePanel.getSelectStart(), this.sk.gui.timelinePanel.getSelectEnd(), this.sk.height / 10, this.sk.height / 1.6);
        else return this.sk.map(value, this.sk.gui.timelinePanel.getSelectStart(), this.sk.gui.timelinePanel.getSelectEnd(), this.sk.gui.timelinePanel.getStart(), this.sk.gui.timelinePanel.getEnd());
    }

    mapTotalTimeToPixelTime(value) {
        return this.sk.map(value, 0, this.sk.core.totalTimeInSeconds, this.sk.gui.timelinePanel.getStart(), this.sk.gui.timelinePanel.getEnd());
    }

    setIsAnimate(value) {
        this.mode.isAnimate = value;
    }

    setIsAlignTalk(value) {
        this.mode.isAlignTalk = value;
    }

    setIsAllTalk(value) {
        this.mode.isAllTalk = value;
    }

    setIsIntro(value) {
        this.mode.isIntro = value;
    }

    setIsVideoPlay(value) {
        this.mode.isVideoPlay = value;
    }

    setIsVideoShow(value) {
        this.mode.isVideoShow = value;
    }

    setRotateRight() {
        this.handleRotation.setRotateRight();
    }

    setRotateLeft() {
        this.handleRotation.setRotateLeft();
    }

    // NOTE: this setter is modifying core vars but this still seems to be best solution
    setCoreData(personFromList) {
        personFromList.isShowing = !personFromList.isShowing;
    }

    getIsIntro() {
        return this.mode.isIntro;
    }

    getIsAnimate() {
        return this.mode.isAnimate;
    }

    /**
     * Returns pixel width for drawing conversation rectangles based on curTotalTime of data, user timeline selection, and maxRectWidth
     * NOTE: curScaledRectWidth parameters 0-3600 scale pixels to 1 hour which works well and the map method maps to the inverse of 1 and maxRectWidth to properly adjust scaling/thickness of rects when user interacts with timeline
     */
    getCurConversationRectWidth() {
        const maxRectWidth = 10;
        const curScaledRectWidth = this.sk.map(this.sk.core.totalTimeInSeconds, 0, 3600, maxRectWidth, 1, true);
        return this.sk.map(this.sk.gui.timelinePanel.getSelectEnd() - this.sk.gui.timelinePanel.getSelectStart(), 0, this.sk.gui.timelinePanel.getLength(), maxRectWidth, curScaledRectWidth);
    }
}