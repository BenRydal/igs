export class SketchController {

    constructor(sketch) {
        this.sk = sketch;
        this.isAnimate = false;
        this.isAnimatePause = false;
        this.isAlignTalk = false;
        this.isAllTalk = true;
        this.isVideoPlay = false;
        this.isVideoShow = false;
        this.isPathColorMode = true;
        this.curSelectTab = 0; // 5 options: None, Region, Slice, Moving, Stopped
        this.wordToSearch = ""; // String value to dynamically search words in conversation
        this.animationCounter = 0; // counter to synchronize animation across all data
        this.dotTimeForVideoScrub = null; // Set in draw movement data and used to display correct video frame when scrubbing video
    }

    updateAnimation() {
        const animationIncrementRateDivisor = 1000; // this divisor seems to work best
        const curTimeIntervalInSeconds = this.mapPixelTimeToTotalTime(this.sk.gui.timelinePanel.getSelectEnd()) - this.mapPixelTimeToTotalTime(this.sk.gui.timelinePanel.getSelectStart()); // Get amount of time in seconds currently displayed
        const animationIncrementValue = curTimeIntervalInSeconds / animationIncrementRateDivisor; // set increment value based on that value/divisor to keep constant sketchController.isAnimate speed regardless of time interval selected
        if (this.animationCounter < this.mapPixelTimeToTotalTime(this.sk.gui.timelinePanel.getSelectEnd())) this.animationCounter += animationIncrementValue;
        else this.setIsAnimate(false);
    }

    startEndAnimation() {
        if (this.isAnimate) this.animationCounter = this.mapPixelTimeToTotalTime(this.sk.gui.timelinePanel.getSelectEnd());
        else this.animationCounter = this.mapPixelTimeToTotalTime(this.sk.gui.timelinePanel.getSelectStart());
        this.setIsAnimate(!this.isAnimate);
        this.setIsAnimatePause(false);
    }

    updateVideoDisplay() {
        this.sk.videoPlayer.updatePos(this.sk.mouseX, this.sk.mouseY, 50, this.sk.gui.timelinePanel.getTop());
        if (!this.getIsVideoPlay()) this.setVideoScrubbing();
    }

    setVideoScrubbing() {
        if (this.isAnimate) this.sk.videoPlayer.seekTo(Math.floor(this.sk.map(this.dotTimeForVideoScrub, this.sk.gui.timelinePanel.getStart(), this.sk.gui.timelinePanel.getEnd(), this.mapPixelTimeToVideoTime(this.sk.gui.timelinePanel.getSelectStart()), this.mapPixelTimeToVideoTime(this.sk.gui.timelinePanel.getSelectEnd()))));
        else if (this.sk.gui.timelinePanel.overTimeline()) {
            this.sk.videoPlayer.seekTo(Math.floor(this.mapPixelTimeToVideoTime(this.mapPixelTimeToSelectTime(this.sk.mouseX))));
            this.sk.videoPlayer.pause(); // Add to prevent accidental video playing that seems to occur
        }
    }

    toggleShowVideo() {
        if (this.sk.sketchController.testVideoAndDivAreLoaded()) {
            if (this.isVideoShow) {
                this.pauseMovie();
                this.sk.videoPlayer.hide();
                this.setIsVideoShow(false);
            } else {
                this.sk.videoPlayer.show();
                this.setIsVideoShow(true);
            }
        }
    }

    // 2 playPause video methods differ with respect to tests and seekTo method call
    playPauseVideoFromTimeline() {
        if (this.isVideoPlay) this.pauseMovie();
        else {
            this.playVideo();
            this.sk.videoPlayer.seekTo(this.mapPixelTimeToVideoTime(this.mapPixelTimeToSelectTime(this.sk.mouseX)));
        }
    }

    playPauseVideoFromButton() {
        if (this.testVideoAndDivAreLoaded() && this.isVideoShow && !this.isAnimate) {
            if (this.isVideoPlay) this.pauseMovie();
            else this.playVideo();
        }
    }

    pauseMovie() {
        this.sk.videoPlayer.pause();
        this.setIsVideoPlay(false);
    }

    playVideo() {
        this.sk.videoPlayer.play();
        this.setIsVideoPlay(true);
    }

    increaseVideoSize() {
        if (this.testVideoAndDivAreLoaded()) this.sk.videoPlayer.increaseSize();
    }

    decreaseVideoSize() {
        if (this.testVideoAndDivAreLoaded()) this.sk.videoPlayer.decreaseSize();
    }

    testVideoToPlay() {
        return this.testVideoAndDivAreLoaded() && this.isVideoShow && !this.isAnimate && this.sk.gui.timelinePanel.overTimeline() && !this.sk.gui.timelinePanel.overEitherSelector();
    }

    testVideoAndDivAreLoaded() {
        return (this.sk.dataIsLoaded(this.sk.videoPlayer) && this.sk.videoPlayer.getIsLoaded());
    }

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
        if (this.sk.handle3D.getIs3DMode()) return this.sk.map(value, this.sk.gui.timelinePanel.getSelectStart(), this.sk.gui.timelinePanel.getSelectEnd(), this.sk.height / 10, this.sk.height / 1.6);
        else return this.mapSelectTimeToPixelTime2D(value);
    }

    mapSelectTimeToPixelTime2D(value) {
        return this.sk.map(value, this.sk.gui.timelinePanel.getSelectStart(), this.sk.gui.timelinePanel.getSelectEnd(), this.sk.gui.timelinePanel.getStart(), this.sk.gui.timelinePanel.getEnd());
    }

    mapTotalTimeToPixelTime(value) {
        return this.sk.map(value, 0, this.sk.core.totalTimeInSeconds, this.sk.gui.timelinePanel.getStart(), this.sk.gui.timelinePanel.getEnd());
    }

    setIsAnimate(value) {
        this.isAnimate = value;
    }

    setIsAnimatePause(value) {
        this.isAnimatePause = value;
    }

    toggleIsAnimatePause() {
        this.isAnimatePause = !this.isAnimatePause;
    }

    getIsAnimate() {
        return this.isAnimate;
    }

    getIsAnimatePause() {
        return this.isAnimatePause;
    }

    setIsAllTalk(value) {
        this.isAllTalk = value;
    }

    getIsAllTalk() {
        return this.isAllTalk;
    }

    toggleIsAlignTalk() {
        this.isAlignTalk = !this.isAlignTalk;
    }

    getIsAlignTalk() {
        return this.isAlignTalk;
    }

    toggleIsAllTalk() {
        this.isAllTalk = !this.isAllTalk;
    }

    getIsVideoPlay() {
        return this.isVideoPlay;
    }

    setIsVideoPlay(value) {
        this.isVideoPlay = value;
    }

    setIsVideoShow(value) {
        this.isVideoShow = value;
    }

    getIsVideoShow() {
        return this.isVideoShow;
    }

    getIsPathColorMode() {
        return this.isPathColorMode;
    }

    toggleIsPathColorMode() {
        this.isPathColorMode = !this.isPathColorMode;
    }

    setIsPathColorMode(value) {
        this.isPathColorMode = value;
    }

    getCurSelectTab() {
        return this.curSelectTab;
    }

    setCurSelectTab(value) {
        this.curSelectTab = value;
    }

    setDotTimeForVideoScrub(timePos) {
        this.dotTimeForVideoScrub = timePos;
    }

    setWordToSearch(value) {
        this.wordToSearch = value;
    }

    getWordToSearch() {
        return this.wordToSearch;
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