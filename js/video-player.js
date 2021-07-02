/**
 * A global videoPlayer object acts as an abstract class for all Player sub-classes
 * All Player classes must implement the following methods: seekTo(time), play(), pause(), mute(), unMute(), getCurrentTime(), getVideoDuration(), destroy(), show(), hide()
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
        this.movie = createDiv();
        this.setMovieDiv();
        this.initializePlayer();
    }

    setMovieDiv() {
        this.movie.id(this.targetId);
        this.movie.size(this.videoWidth, this.videoHeight);
        this.movie.hide();
        this.movie.position(keys.timelineStart, 0);
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
        this.movie.remove(); // remove the div element
    }
}

class P5FilePlayer {

    /**
     * @param  {fileName: 'your_fileLocation_here'} params
     */
    constructor(params) {
        this.videoWidth = width / 5;
        this.videoHeight = width / 6;
        //this.movieDiv = sketch.createVideo(fileLocation, () => {
        this.movie = createVideo(params['fileName'], () => {
            this.movie.onload = () => URL.revokeObjectURL(this.src);
            this.setMovieDiv();
            handlers.overVideoButton(); // Show video once it has been loaded
            console.log("File Player Ready:");
            loop(); // rerun P5 draw loop after loading image
        });
    }

    setMovieDiv() {
        this.movie.id('moviePlayer');
        this.movie.size(width / 5, width / 6);
        this.movie.hide();
        this.movie.position(keys.timelineStart, 0);
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
        this.movie.time(t);
    }

    play() {
        this.movie.play();
    }

    pause() {
        this.movie.pause();
    }

    mute() {
        this.movie.volume(0);
    }

    unMute() {
        this.movie.volume(1);
    }

    getCurrentTime() {
        return this.movie.time();
    }

    getVideoDuration() {
        return this.movie.duration();
    }

    destroy() {
        this.movie.remove(); // remove the div element
    }
}