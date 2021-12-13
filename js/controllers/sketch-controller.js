class SketchController {

    constructor(sketch) {
        this.sk = sketch;
        this.mode = {
            isAnimate: false,
            isAnimatePause: false,
            isAlignTalk: false,
            isAllTalk: true,
            isVideoPlay: false,
            isVideoShow: false,
            isPathColorMode: true,
            curSelectTab: 0, // 5 options: None, Region, Slice, Moving, Stopped
            wordToSearch: "" // String value to dynamically search words in conversation

        }
        this.handle3D = new Handle3D(this.sk, true); // boolean sets 3D to showing
        this.handleRotation = new HandleRotation(this.sk);
        this.animationCounter = 0; // counter to synchronize animation across all data
        this.dotTimeForVideoScrub = null; // Set in draw movement data and used to display correct video frame when scrubbing video
    }

    // ****** P5 HANDLERS ****** //
    updateLoop() {
        if ((this.mode.isAnimate && !this.mode.isAnimatePause) || this.mode.isVideoPlay || this.handle3D.getIsTransitioning()) this.sk.loop();
        else this.sk.noLoop();
    }

    handleMousePressed() {
        if (this.testVideoToPlay()) this.playPauseMovie();
    }

    handleMouseDragged() {
        if (!this.mode.isAnimate) this.sk.gui.timelinePanel.handle();
    }

    handleMouseReleased() {
        this.sk.gui.timelinePanel.resetLock();
    }

    handleMouseMoved() {
        if (this.sk.gui.timelinePanel.overEitherSelector()) this.sk.cursor(this.sk.HAND);
        else this.sk.cursor(this.sk.ARROW);
    }

    handleToggle3D() {
        this.handle3D.toggleIsShowing();
        this.handle3D.setIsTransitioning(true);
        if (this.handle3D.getIsShowing()) this.setRotateRight(); // must rotate floor plan to make matching space-time view appear in both 2D and 3D
        else this.setRotateLeft();
        this.sk.loop();
    }

    // ****** UPDATE METHODS ****** //

    updateAnimation() {
        if (this.mode.isAnimate && !this.mode.isAnimatePause) {
            const animationIncrementRateDivisor = 1000; // this divisor seems to work best
            const curTimeIntervalInSeconds = this.mapPixelTimeToTotalTime(this.sk.gui.timelinePanel.getSelectEnd()) - this.mapPixelTimeToTotalTime(this.sk.gui.timelinePanel.getSelectStart()); // Get amount of time in seconds currently displayed
            const animationIncrementValue = curTimeIntervalInSeconds / animationIncrementRateDivisor; // set increment value based on that value/divisor to keep constant sketchController.mode.isAnimate speed regardless of time interval selected
            if (this.animationCounter < this.mapPixelTimeToTotalTime(this.sk.gui.timelinePanel.getSelectEnd())) this.animationCounter += animationIncrementValue;
            else this.setIsAnimate(false);
        }
    }

    startEndAnimation() {
        if (this.mode.isAnimate) this.animationCounter = this.mapPixelTimeToTotalTime(this.sk.gui.timelinePanel.getSelectEnd());
        else this.animationCounter = this.mapPixelTimeToTotalTime(this.sk.gui.timelinePanel.getSelectStart());
        this.setIsAnimate(!this.mode.isAnimate);
        this.setIsAnimatePause(false);
    }

    updateVideoDisplay() {
        if (this.mode.isVideoShow) {
            const xPos = this.sk.constrain(this.sk.mouseX, this.sk.width / 5, this.sk.width);
            const yPos = this.sk.constrain(this.sk.mouseY, 50, this.sk.gui.timelinePanel.getTop() - this.sk.width / 6);
            this.sk.videoPlayer.updatePos(xPos, yPos);
            if (!this.mode.isVideoPlay) this.setVideoScrubbing();
        }
    }

    setVideoScrubbing() {
        if (this.mode.isAnimate) this.sk.videoPlayer.seekTo(Math.floor(this.sk.map(this.dotTimeForVideoScrub, this.sk.gui.timelinePanel.getStart(), this.sk.gui.timelinePanel.getEnd(), this.mapPixelTimeToVideoTime(this.sk.gui.timelinePanel.getSelectStart()), this.mapPixelTimeToVideoTime(this.sk.gui.timelinePanel.getSelectEnd()))));
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
        if (this.sk.gui.timelinePanel.aboveTimeline(this.sk.mouseX, this.sk.mouseY)) {
            this.sk.gui.timelinePanel.draw3DSlicerRect(this.sk.gui.fpContainer.getContainer(), this.mapToSelectTimeThenPixelTime(this.sk.mouseX)); // pass mapped mouseX as zPos
        }
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

    setIsAnimatePause(value) {
        this.mode.isAnimatePause = value;
    }

    toggleIsAnimatePause() {
        this.mode.isAnimatePause = !this.mode.isAnimatePause;
    }

    getIsAnimate() {
        return this.mode.isAnimate;
    }

    setIsAllTalk(value) {
        this.mode.isAllTalk = value;
    }

    toggleIsAlignTalk() {
        this.mode.isAlignTalk = !this.mode.isAlignTalk;
    }

    toggleIsAllTalk() {
        this.mode.isAllTalk = !this.mode.isAllTalk;
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


    getIsPathColorMode() {
        return this.mode.isPathColorMode;
    }

    toggleIsPathColorMode() {
        this.mode.isPathColorMode = !this.mode.isPathColorMode;
    }

    setIsPathColorMode(value) {
        this.mode.isPathColorMode = value;
    }

    getCurSelectTab() {
        return this.mode.curSelectTab;
    }

    setCurSelectTab(value) {
        this.mode.curSelectTab = value;
    }

    setDotTimeForVideoScrub(timePos) {
        this.dotTimeForVideoScrub = timePos;
    }

    setWordToSearch(value) {
        this.mode.wordToSearch = value;
    }

    getWordToSearch() {
        return this.mode.wordToSearch;
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