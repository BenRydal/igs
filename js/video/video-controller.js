/**
 * This class controls creation and manipulation of videos loaded by users or from example data
 * Holds a videoPlayer object that serves as an abstract class for different types of video players (e.g., youtube, from local files)
 * VideoPlayer object can be updated, erased/replaced dynamically
 * This class also holds data used by program to interact/play and pause a video
 */

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

    /**
     * Updates video image and position
     */
    updateDisplay() {
        if (this.isPlayerAndDivLoaded() && this.isShowing) {
            this.videoPlayer.updatePos(this.sk.mouseX, this.sk.mouseY, 50, this.sk.gui.timelinePanel.getTop());
            if (!this.isPlaying) this.setVideoScrubbing();
        }
    }

    setVideoScrubbing() {
        if (this.sk.sketchController.getIsAnimate()) this.seekMethodAnimate();
        else if (this.sk.gui.timelinePanel.overTimeline()) {
            this.seekMethodMouse();
            this.videoPlayer.pause(); // Add to prevent accidental video playing that seems to occur
        }
    }

    seekMethodAnimate() {
        const videoTime = Math.floor(this.sk.map(this.dotTimeForVideoScrub, this.sk.gui.timelinePanel.getStart(), this.sk.gui.timelinePanel.getEnd(), this.mapPixelTimeToVideoTime(this.sk.gui.timelinePanel.getSelectStart()), this.mapPixelTimeToVideoTime(this.sk.gui.timelinePanel.getSelectEnd())));
        this.videoPlayer.seekTo(videoTime);
    }

    seekMethodMouse() {
        const videoTime = Math.floor(this.mapPixelTimeToVideoTime(this.sk.sketchController.mapPixelTimeToSelectTime(this.sk.mouseX)));
        this.videoPlayer.seekTo(videoTime);

    }

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

    mapPixelTimeToVideoTime(value) {
        return Math.floor(this.sk.map(value, this.sk.gui.timelinePanel.getStart(), this.sk.gui.timelinePanel.getEnd(), 0, Math.floor(this.videoPlayer.getVideoDuration()))); // must floor vPos to prevent double finite error
    }

    getVideoPlayerCurTime() {
        return this.videoPlayer.getCurrentTime();
    }

    setDotTimeForVideoScrub(timePos) {
        this.dotTimeForVideoScrub = timePos;
    }

    isLoadedAndIsPlaying() {
        return this.isPlayerAndDivLoaded() && this.isPlaying;
    }
    /**
     * NOTE: boolean test is additional test to make sure video is loaded as sometimes a videoPlayer object
     * can be created from a file but the data is corrupt in some way
     */
    isPlayerAndDivLoaded() {
        return (this.sk.dataIsLoaded(this.videoPlayer) && this.isLoaded);
    }

    clear() {
        if (this.sk.dataIsLoaded(this.videoPlayer)) { // if any type of videoPlayer object exists, even if data is corrupt destroy it
            this.videoPlayer.destroy();
            this.videoPlayer = null;
            this.isPlaying = false;
            this.isShowing = false;
            this.isLoaded = false;
        }
    }
}