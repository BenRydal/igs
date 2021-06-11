/**
 * A global videoPlayer object acts as an abstract class for all Player sub-classes
 * All Player classes must implement the following methods:
 * seekTo(time), play(), pause(), mute(), unMute(), getCurrentTime(), getVideoDuration(), destroy(), show(), hide()
 */
class YoutubePlayer {
    /**
     * Include the following script in head of the format: <script type = "text/javascript" src = "https://www.youtube.com/iframe_api"> < /script>
     * @param  {videoId: 'your_videoId_here'} params
     */
    constructor(params) {
        this.targetId = 'moviePlayer';
        this.videoId = params['videoId'];
        this.videoWidth = width / 5;
        this.videoHeight = width / 6;
        this.initializeDiv();
        this.initializePlayer();
    }

    initializeDiv() {
        movie = createDiv(); // create the div that will hold the video if other player
        movie.id(this.targetId);
        movie.size(this.videoWidth, this.videoHeight);
        movie.hide();
        movie.position(keys.timelineStart, 0);
    }


    initializePlayer() {
        this.player = new YT.Player(this.targetId, {
            videoId: this.videoId,
            playerVars: {
                controls: 0, // hides controls on the video
                disablekb: 1, // disables keyboard controls on the video
            },
            events: {
                'onReady': this.onPlayerReady,
            }
        });
    }

    // The API will call this function when the video player is ready.
    onPlayerReady() {
        console.log("YT player ready: ");
        handlers.overVideoButton(); // Show video once loaded
        loop(); // rerun P5 draw loop after loading image
    }

    show() {
        let element = document.querySelector('#moviePlayer');
        element.style.display = 'block';
    }

    hide() {
        let element = document.querySelector('#moviePlayer');
        element.style.display = 'none';
    }

    seekTo(time) {
        this.player.seekTo(time, true);
    }

    play() {
        this.player.playVideo();
    }

    pause() {
        this.player.pauseVideo();
    }

    mute() {
        this.player.mute();
    }

    unMute() {
        this.player.unMute();
    }

    getCurrentTime() {
        return this.player.getCurrentTime();
    }

    getVideoDuration() {
        return this.player.getDuration();
    }

    destroy() {
        this.player.destroy(); // destroy the player object
        movie.remove(); // remove the div element
    }
}

class P5FilePlayer {

    /**
     * @param  {fileName: 'your_fileLocation_here'} params
     */
    constructor(params) {
        this.videoWidth = width / 5;
        this.videoHeight = width / 6;
        movie = createVideo(params['fileName'], function () {
            movie.id('moviePlayer');
            movie.size(width / 5, width / 6);
            movie.hide();
            movie.position(keys.timelineStart, 0);
            movie.onload = function () {
                URL.revokeObjectURL(this.src);
            }
            handlers.overVideoButton(); // Show video once it has been loaded
            console.log("File Player Ready:");
            loop(); // rerun P5 draw loop after loading image
        });
    }

    show() {
        let element = document.querySelector('#moviePlayer');
        element.style.display = 'block';
    }

    hide() {
        let element = document.querySelector('#moviePlayer');
        element.style.display = 'none';
    }

    seekTo(t) {
        movie.time(t);
    }

    play() {
        movie.play();
    }

    pause() {
        movie.pause();
    }

    mute() {
        movie.volume(0);
    }

    unMute() {
        movie.volume(1);
    }

    getCurrentTime() {
        return movie.time();
    }

    getVideoDuration() {
        return movie.duration();
    }

    destroy() {
        movie.remove(); // remove the div element
    }
}