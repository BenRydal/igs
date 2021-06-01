/**********************************************************************************************
Additional implementation of VideoPlayer should have the following methods: seekTo(time), play(), pause(), mute(), 
unMute(), getCurrentTime(), getVideoDuration(), destroy(), show(), hide()

/ ******* FilePlayer Vars *******
Videoparams expects 1 item, the fileName, videoParams = { fileName: 'your_fileName_here' };
let videoPlatform = 'File'; // what platform the video is being hosted on, specifies what videoPlayer should be instantiated during setupMovie
let videoParams = { fileName: '[your_directory_fileLocation]' };

// ******* YouTube Vars *******
Include following script in head of the format: 
<script type="text/javascript" src="https://www.youtube.com/iframe_api"></script>
VideoParams expects 1 item, the videoId, videoParams = { videoId: 'your_videoId_here' };
let videoPlatform = 'Youtube'; 
let videoParams = { videoId: 'Iu0rxb-xkMk'};

// ******* Kaltura Vars *******
Include following script in head of the format: 
<script src="https://cdnapi.kaltura.com/p/{partner_id}/sp/{partnerId}00/embedIframeJs/uiconf_id/{uiconf_id}/partner_id/{partnerId}"></script>
VideoParams expects 3 items, the wid, uiconf_id, and entry_id, videoParams = { wid: 'your_wid_here', uiconf_id: 'your_uiconf_id_here', entry_id: 'your_entry_id_here' };
var videoPlatform = 'Kaltura';
var videoParams = { wid: '_1038472', uiconf_id: '33084471', entry_id: '1_9tp4soob' };
**********************************************************************************************/

// This is the VideoPlayer implementation that utilizes the Youtube Player API
class YoutubePlayer {

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
            console.log("File Player Ready:");
            handlers.overVideoButton(); // Show video once it has been loaded
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
        movie.time(t); // jumps to time parameter
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