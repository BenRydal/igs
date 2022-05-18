import { YoutubePlayer, P5FilePlayer } from '../video/video-player.js';


export class VideoController {

    constructor(sketch) {
        this.sk = sketch;
        this.videoPlayer = null;
        this.isPlaying = false;
        this.isShowing = false;
        this.dotTimeForVideoScrub = null; // Set in draw movement data and used to display correct video frame when scrubbing video
        // TODO: move isLoaded boolean here??
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

    clear() {
        if (this.sk.dataIsLoaded(this.videoPlayer)) { // if there is a video, destroy it
            this.videoPlayer.destroy();
            this.videoPlayer = null;
            this.isPlaying = false;
            this.isShowing = false;
        }
    }

    // videoPlayer.getCurrentTime()
    // videoPlayer.getVideoDuration

    getIsPlaying() {
        // TODO: add test if loaded!?
        return this.isPlaying;
    }

    setDotTimeForVideoScrub(timePos) {
        this.dotTimeForVideoScrub = timePos;
    }


    // TODO: might send some params to this for this method and setVideo scrubbing
    updateDisplay() {
        if (this.testVideoAndDivAreLoaded() && this.isShowing) {
            this.videoPlayer.updatePos(this.sk.mouseX, this.sk.mouseY, 50, this.sk.gui.timelinePanel.getTop());
            if (!this.getIsPlaying()) this.setVideoScrubbing();
        }
    }

    setVideoScrubbing() {
        if (this.sk.sketchController.getIsAnimate()) {
            this.videoPlayer.seekTo(Math.floor(this.sk.map(this.dotTimeForVideoScrub, this.sk.gui.timelinePanel.getStart(), this.sk.gui.timelinePanel.getEnd(), this.sk.sketchController.mapPixelTimeToVideoTime(this.sk.gui.timelinePanel.getSelectStart()), this.sk.sketchController.mapPixelTimeToVideoTime(this.sk.gui.timelinePanel.getSelectEnd()))));
        } else if (this.sk.gui.timelinePanel.overTimeline()) {
            this.videoPlayer.seekTo(Math.floor(this.sk.sketchController.mapPixelTimeToVideoTime(this.sk.sketchController.mapPixelTimeToSelectTime(this.sk.mouseX))));
            this.videoPlayer.pause(); // Add to prevent accidental video playing that seems to occur
        }
    }

    // TODO: PASS VIDEO CONTROLLER TO players and create new upload method??
    // where you set isLoaded, toggle show and call sketch loop?
    toggleShowVideo() {
        if (this.testVideoAndDivAreLoaded()) {
            if (this.isShowing) {
                this.pauseMovie();
                this.videoPlayer.hide();
                this.isShowing = false;
            } else {
                this.videoPlayer.show();
                this.isShowing = true;

            }
        }
    }

    // 2 playPause video methods differ with respect to tests and seekTo method call
    playPauseVideoFromTimeline() {
        if (this.testVideoAndDivAreLoaded() && this.isShowing) {
            if (this.isPlaying) this.pauseMovie();
            else {
                this.playMovie();
                this.videoPlayer.seekTo(this.sk.sketchController.mapPixelTimeToVideoTime(this.sk.sketchController.mapPixelTimeToSelectTime(this.sk.mouseX)));
            }
        }
    }

    playPauseVideoFromButton() {
        if (this.testVideoAndDivAreLoaded() && this.isShowing && !this.sk.sketchController.getIsAnimate()) {
            if (this.isPlaying) this.pauseMovie();
            else this.playMovie();
        }
    }

    pauseMovie() {
        this.videoPlayer.pause();
        this.isPlaying = false;
    }

    // TODO: update this method name--matches YT player
    playMovie() {
        this.videoPlayer.play();
        this.isPlaying = true;
    }

    increaseVideoSize() {
        if (this.testVideoAndDivAreLoaded()) this.videoPlayer.increaseSize();
    }

    decreaseVideoSize() {
        if (this.testVideoAndDivAreLoaded()) this.videoPlayer.decreaseSize();
    }

    testVideoAndDivAreLoaded() {
        return (this.sk.dataIsLoaded(this.videoPlayer) && this.videoPlayer.getIsLoaded());
    }
}