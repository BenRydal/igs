import { YoutubePlayer, P5FilePlayer } from '../video/video-player.js';


export class VideoController {

    constructor(sketch) {
        this.sk = sketch;
        this.videoPlayer = null;
        this.isPlaying = false;
        this.isShowing = false;
        this.isLoaded = false; // this is an additional boolean to test if video successfully loaded
        this.dotTimeForVideoScrub = null; // Set in draw movement data and used to display correct video frame when scrubbing video
    }

    createVideoPlayer(platform, params) {
        try {
            switch (platform) {
                case "Youtube":
                    this.videoPlayer = new YoutubePlayer(this.sk, params);
                    break;
                case "File":
                    this.videoPlayer = new P5FilePlayer(this.sk, params);
                    break;
            }
        } catch (error) {
            alert("Error loading video file. Please make sure your video is formatted correctly as a .MP4 file or if loading an example dataset that you have access to YouTube");
            console.log(error);
        }
    }

    /**
     * Called from Youtube/File player API if videoPlayer loaded successfully
     */
    videoPlayerReady() {
        this.isLoaded = true;
        this.toggleShowVideo();
        this.sk.loop();
    }

    // TODO: might send some params to this for this method and setVideo scrubbing
    updateDisplay(timelinePanel) {
        if (this.isPlayerAndDivLoaded() && this.isShowing) {
            this.videoPlayer.updatePos(this.sk.mouseX, this.sk.mouseY, 50, timelinePanel.getTop());
            if (!this.getIsPlaying()) this.setVideoScrubbing(timelinePanel);
        }
    }

    setVideoScrubbing(timelinePanel) {
        if (this.sk.sketchController.getIsAnimate()) this.seekMethodAnimate(timelinePanel);
        else if (timelinePanel.overTimeline()) {
            this.seekMethodMouse();
            this.videoPlayer.pause(); // Add to prevent accidental video playing that seems to occur
        }
    }

    // TODO: add if loaded tests?
    mapPixelTimeToVideoTime(value) {
        return Math.floor(this.sk.map(value, this.sk.gui.timelinePanel.getStart(), this.sk.gui.timelinePanel.getEnd(), 0, Math.floor(this.videoPlayer.getVideoDuration()))); // must floor vPos to prevent double finite error
    }

    getVideoPlayerCurTime() {
        return this.videoPlayer.getCurrentTime();
    }

    getIsPlaying() {
        // TODO: add test if loaded!?
        return this.isPlaying;
    }

    setDotTimeForVideoScrub(timePos) {
        this.dotTimeForVideoScrub = timePos;
    }

    seekMethodAnimate(timelinePanel) {
        const videoTime = Math.floor(this.sk.map(this.dotTimeForVideoScrub, timelinePanel.getStart(), timelinePanel.getEnd(), this.mapPixelTimeToVideoTime(timelinePanel.getSelectStart()), this.mapPixelTimeToVideoTime(timelinePanel.getSelectEnd())));
        this.videoPlayer.seekTo(videoTime);
    }

    seekMethodMouse() {
        const videoTime = Math.floor(this.mapPixelTimeToVideoTime(this.sk.sketchController.mapPixelTimeToSelectTime(this.sk.mouseX)));
        this.videoPlayer.seekTo(videoTime);

    }

    // TODO: PASS VIDEO CONTROLLER TO players and create new upload method??
    // where you set isLoaded, toggle show and call sketch loop?
    toggleShowVideo() {
        if (this.isPlayerAndDivLoaded()) {
            if (this.isShowing) {
                this.pause();
                this.videoPlayer.hide();
                this.isShowing = false;
            } else {
                this.videoPlayer.show();
                this.isShowing = true;

            }
        }
    }

    // 2 playPause video methods differ with respect to tests and seekTo method call
    timelinePlayPause() {
        if (this.isPlayerAndDivLoaded() && this.isShowing) {
            if (this.isPlaying) this.pause();
            else {
                this.play();
                this.seekMethodMouse();
            }
        }
    }

    buttonPlayPause() {
        if (this.isPlayerAndDivLoaded() && this.isShowing && !this.sk.sketchController.getIsAnimate()) {
            if (this.isPlaying) this.pause();
            else this.play();
        }
    }

    pause() {
        this.videoPlayer.pause();
        this.isPlaying = false;
    }

    play() {
        this.videoPlayer.play();
        this.isPlaying = true;
    }

    increasePlayerSize() {
        if (this.isPlayerAndDivLoaded()) this.videoPlayer.increaseSize();
    }

    decreasePlayerSize() {
        if (this.isPlayerAndDivLoaded()) this.videoPlayer.decreaseSize();
    }

    isPlayerAndDivLoaded() {
        return (this.sk.dataIsLoaded(this.videoPlayer) && this.isLoaded);
    }

    clear() {
        if (this.sk.dataIsLoaded(this.videoPlayer)) { // if there is a video, destroy it
            this.videoPlayer.destroy();
            this.videoPlayer = null;
            this.isPlaying = false;
            this.isShowing = false;
            this.isLoaded = false;
        }
    }
}