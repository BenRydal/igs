/**
 * A global videoPlayer object acts as an abstract class for all Player sub-classes
 * All Player classes must implement the following methods: seekTo(time), play(), pause(), mute(), unMute(), getCurrentTime(), getVideoDuration(), destroy(), show(), hide()
 */
export class YoutubePlayer {
    /**
     * Include the following script in head of the format: <script type = "text/javascript" src = "https://www.youtube.com/iframe_api"> < /script>
     * @param  {videoId: 'your_videoId_here'} params
     */
    constructor(sketch, params) {
        this.sk = sketch;
        this.targetId = 'moviePlayer';
        this.selectId = '#moviePlayer';
        this.videoId = params['videoId'];
        this.duration = null;
        this.videoWidth = this.sk.width / 5; // these dimensions work nicely for example data
        this.videoHeight = this.sk.width / 7;
        this.increment = 25;
        this.movie = this.sk.createDiv();
        this.setMovieDiv();
        this.initializePlayer();
    }

    setMovieDiv() {
        this.movie.id(this.targetId);
        this.movie.size(this.videoWidth, this.videoHeight);
        this.movie.position(0, 0);
    }


    initializePlayer() {
        this.player = new YT.Player(this.targetId, {
            videoId: this.videoId,
            playerVars: {
                controls: 0, // hides controls on the video
                disablekb: 1, // disables keyboard controls on the video
                playsinline: 1 // plays inline for mobile browsers not fullscreen
            },
            events: {
                'onReady': () => {
                    console.log("YT player ready: ");
                    this.duration = this.player.getDuration();
                    this.sk.videoController.videoPlayerReady();
                }
            }
        });
    }

    show() {
        document.querySelector(this.selectId).style.display = 'block';
    }

    hide() {
        document.querySelector(this.selectId).style.display = 'none';
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
        return this.duration;
    }

    updatePos(mouseX, mouseY, top, bottom) {
        const xPos = this.sk.constrain(mouseX, this.videoWidth, this.sk.width);
        const yPos = this.sk.constrain(mouseY, top, bottom - this.videoHeight);
        this.sk.select(this.selectId).position(xPos - this.videoWidth, yPos);
    }

    increaseSize() {
        this.videoHeight = (this.videoHeight / this.videoWidth) * (this.videoWidth + this.increment);
        this.videoWidth += this.increment;
        this.sk.select(this.selectId).size(this.videoWidth, this.videoHeight);
    }

    decreaseSize() {
        this.videoHeight = (this.videoHeight / this.videoWidth) * (this.videoWidth - this.increment);
        this.videoWidth -= this.increment;
        this.sk.select(this.selectId).size(this.videoWidth, this.videoHeight);
    }

    destroy() {
        this.player.destroy(); // destroy the player object
        this.movie.remove(); // remove the div element
    }
}

export class P5FilePlayer {

    /**
     * @param  {fileName: 'your_fileLocation_here'} params
     */
    constructor(sketch, params) {
        this.sk = sketch;
        this.targetId = 'moviePlayer';
        this.selectId = '#moviePlayer';
        this.duration = null;
        this.videoWidth = null;
        this.videoHeight = null;
        this.increment = 25; //for increasing and decreasing video size
        this.isOver = false; // used internally to test if user selected movie element
        this.movie = this.sk.createVideo(params['fileName'], () => {
            console.log("File Player Ready:");
            this.setMovieDiv();
            this.sk.videoController.videoPlayerReady();
        });
    }

    setMovieDiv() {
        this.movie.id(this.targetId);
        this.videoWidth = this.sk.width / 5; // nice starting width for all loaded videos
        this.videoHeight = (this.movie.height / this.movie.width) * this.videoWidth; // scale height proportional to original aspect ratio
        this.movie.size(this.videoWidth, this.videoHeight);
        this.duration = this.movie.duration();
        this.movie.position(0, 0);
        this.movie.mousePressed(() => {
            this.isOver = true;
        });
        this.movie.mouseReleased(() => {
            this.isOver = false;
        });
        this.movie.mouseOver(() => {
            this.sk.select(this.selectId).style('cursor', 'grab'); // set mouse cursor style--this overrides any P5 cursor styles set in draw loop
        });
    }

    show() {
        let element = document.querySelector(this.selectId);
        element.style.display = 'block';
    }

    hide() {
        let element = document.querySelector(this.selectId);
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
        return this.duration;
    }

    updatePos(mouseX, mouseY, top, bottom) {
        const xPos = this.sk.constrain(mouseX, this.videoWidth / 2, this.sk.width - this.videoWidth / 2);
        const yPos = this.sk.constrain(mouseY, top + this.videoHeight / 2, bottom - this.videoHeight / 2);
        if (this.isOver) this.sk.select(this.selectId).position(xPos - this.videoWidth / 2, yPos - this.videoHeight / 2);
    }

    increaseSize() {
        this.videoHeight = (this.videoHeight / this.videoWidth) * (this.videoWidth + this.increment);
        this.videoWidth += this.increment;
        this.sk.select(this.selectId).size(this.videoWidth, this.videoHeight);
    }

    decreaseSize() {
        this.videoHeight = (this.videoHeight / this.videoWidth) * (this.videoWidth - this.increment);
        this.videoWidth -= this.increment;
        this.sk.select(this.selectId).size(this.videoWidth, this.videoHeight);
    }

    destroy() {
        this.movie.remove(); // remove the div element
    }
}