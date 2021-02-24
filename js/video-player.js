/**********************************************************************************************
Conceptually, KalturaPlayer and YoutubePlayer are implementations of a VideoPlayer interface; this
means that they support the same functionality by having the same set of method names, but behind
the scenes, achieve the functionality in different ways (by relying on platform-specific APIs).

But because JS is dynamically typed, we don't actually need to declare a VideoPlayer interface.
Any additional implementation of VideoPlayer should have the following methods:
    seekTo(time), play(), pause(), mute(), unMute(), getCurrentTime(), getVideoDuration(), destroy()

Note the params variable passed into the constructors, this is designed to be a dictionary
containing any relevant settings that are used to initailize the player to the correct video.
This params variable is declared in main.js and is called 'videoParams'; note that in setupMovie,
the 'targetId' is added to the params to specify the div holding the player
**********************************************************************************************/

// ******* INPUT VIDEO PLATFORMS *******
// 3 platforms, 'File', 'YouTube', 'Kaltura' see video-player.js for more details
// For videoPlatform 'File', videoparams expects 1 item, the fileName, videoParams = { fileName: 'your_fileName_here' };
// let videoPlatform = 'File'; // what platform the video is being hosted on, specifies what videoPlayer should be instantiated during setupMovie
// let videoParams = { fileName: 'data/video.mp4' };

// For videoPlatform 'Youtube', videoParams expects 1 item, the videoId, videoParams = { videoId: 'your_videoId_here' };
// let videoPlatform = 'Youtube'; 
// let videoParams = {
//     videoId: 'Iu0rxb-xkMk'
// };

// For videoPlatform 'Kaltura', videoParams expects 3 items, the wid, uiconf_id, and entry_id, videoParams = { wid: 'your_wid_here', uiconf_id: 'your_uiconf_id_here', entry_id: 'your_entry_id_here' };
// var videoPlatform = 'Kaltura';
// var videoParams = {
//     wid: '_1038472',
//     uiconf_id: '33084471',
//     entry_id: '1_9tp4soob'
// };


// This is the VideoPlayer implementation that utilizes the Kaltura Player Javascript API
// Note to use a Kaltura Player, a script must be imported of the format:
//     <script src="https://cdnapi.kaltura.com/p/{partner_id}/sp/{partnerId}00/embedIframeJs/uiconf_id/{uiconf_id}/partner_id/{partnerId}"></script>
class KalturaPlayer {

    // For a KalturaPlayer, Main.js should have:
    // videoPlatform = 'Kaltura';
    // videoParams = { wid: 'your_wid_here', uiconf_id: 'your_uiconf_id_here', entry_id: 'your_entry_id_here' };
    constructor(params) {
        this.targetId = params['targetId'];
        this.wid = params['wid'];
        this.uiconf_id = params['uiconf_id'];
        this.entry_id = params['entry_id'];
        this.initialize();
    }

    initialize() {
        kWidget.embed({
            'targetId': this.targetId,
            'wid': this.wid,
            'uiconf_id': this.uiconf_id,
            'entry_id': this.entry_id,
            'flashvars': { // flashvars allows you to set runtime uiVar configuration overrides.
                'controlBarContainer.plugin': false, // hides controls on the video
                'disableOnScreenClick': true,
                'largePlayBtn.plugin': false,
                'autoPlay': false
            },
            'params': { // params allows you to set flash embed params such as wmode, allowFullScreen etc
                'wmode': 'transparent'
            }
        });
        this.player = document.getElementById(this.targetId);
    }

    seekTo(time) {
        this.player.sendNotification('doSeek', time);
    }

    play() {
        this.player.sendNotification('doPlay');
    }

    pause() {
        this.player.sendNotification('doPause');
    }

    mute() {
        this.player.sendNotification('changeVolume', 0);
    }

    unMute() {
        this.player.sendNotification('changeVolume', 1);
    }

    getCurrentTime() {
        return this.player.evaluate('{video.player.currentTime}');
    }

    getVideoDuration() {
        return this.player.duration();
    }

    destroy() {
    }
}


class FilePlayer {
    
    // For a FilePlayer, Main.js should have:
    // videoPlatform = 'File';
    // videoParams = { fileName: 'your_fileName_here' };

    constructor(params) {
        this.targetId = params['targetId'];
        this.fileName = params['fileName'];
        this.initialize();
    }

    initialize() {
        movie.hideControls(); // hide default browser controls
    }

    seekTo(time) {
        movie.time(time); // jumps to time parameter
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
      }
}

// This is the VideoPlayer implementation that utilizes the Youtube Player API
// Note to use a Youtube Player, the Youtube iFrame Player API must be loaded of the format:
// <script type="text/javascript" src="https://www.youtube.com/iframe_api"></script>

class YoutubePlayer {

    // For a YoutubePlayer, Main.js should have:
    // videoPlatform = 'Youtube';
    // videoParams = { videoId: 'your_videoId_here' };
    constructor(params) {
        this.targetId = params['targetId'];
        this.videoId = params['videoId'];
        this.initialize();
    }

    initialize() {
        this.player = new YT.Player(this.targetId, {
            videoId: this.videoId,
            playerVars: {
                controls: 0, // hides controls on the video
                disablekb: 1, // disables keyboard controls on the video
            }
        });
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
        this.player.destroy();
    }
}
