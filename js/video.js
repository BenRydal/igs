// Updates time selected in video for animation or when mouse is clicked
function updateVideoScrubbing() {
    if (animation) {
        let startValue = map(currPixelTimeMin, timelineStart, timelineEnd, 0, videoPlayer.getVideoDuration()); // remap starting point to seek for video
        let endValue = map(currPixelTimeMax, timelineStart, timelineEnd, 0, videoPlayer.getVideoDuration()); // remap starting point to seek for video
        videoPlayer.seekTo(map(bugTimePosForVideo, timelineStart, timelineEnd, startValue, endValue));
    } else if (!videoIsPlaying && overRect(timelineStart, 0, timelineEnd, timelineHeight)) {
        let initialValue = map(mouseX, timelineStart, timelineEnd, currPixelTimeMin, currPixelTimeMax); // first map mouse to selected time values in GUI
        videoPlayer.seekTo(map(initialValue, timelineStart, timelineEnd, 0, videoPlayer.getVideoDuration()));
    }
}

function setVideoSizeSmall() {
    let iFrameID = document.getElementById('moviePlayer');
    iFrameID.width = vidWidthSmall;
    iFrameID.height = vidHeightSmall;
}

function setVideoSizeLarge() {
    let iFrameID = document.getElementById('moviePlayer');
    iFrameID.width = vidWidthLarge;
    iFrameID.height = vidHeightLarge;
}

// Plays/pauses video and toggles videoIsPlaying
function playPauseMovie() {
    if (videoIsPlaying) {
        videoPlayer.pause();
        setVideoSizeSmall();
        videoIsPlaying = false;
    } else {
        let mPos = map(mouseX, timelineStart, timelineEnd, currPixelTimeMin, currPixelTimeMax); // first map mouse to selected time values in GUI
        setVideoSizeLarge();
        videoPlayer.play();
        videoPlayer.seekTo(map(mPos, timelineStart, timelineEnd, 0, videoPlayer.getVideoDuration()));
        videoIsPlaying = true;
    }
}