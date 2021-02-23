// Initialization for the video player
function setupMovie(movieDiv, platform, params) {
    params['targetId'] = movieDiv; // regardless of platform, the videoPlayer needs a target div
    // Based on the specified platform, chose the appropriate type of videoPlayer to use
    switch (platform) {
        case "Kaltura":
            videoPlayer = new KalturaPlayer(params);
            break;
        case "Youtube":
            videoPlayer = new YoutubePlayer(params);
            break;
        case "File":
            videoPlayer = new FilePlayer(params);
            break;
    }
}

// Updates time selected in video for animation or when mouse is clicked
function updateVideoScrubbing() {
    if (animation) {
        let startValue = map(currPixelTimeMin, timelineStart, timelineEnd, 0, totalTimeInSeconds); // remap starting point to seek for video
        let endValue = map(currPixelTimeMax, timelineStart, timelineEnd, 0, totalTimeInSeconds); // remap starting point to seek for video
        videoPlayer.seekTo(map(bugTimePosForVideo, timelineStart, timelineEnd, startValue, endValue));

    } else if (!videoIsPlaying && overRect(timelineStart, 0, timelineEnd, timelineHeight)) {
        let initialValue = map(mouseX, timelineStart, timelineEnd, currPixelTimeMin, currPixelTimeMax); // first map mouse to selected time values in GUI
        videoPlayer.seekTo(map(initialValue, timelineStart, timelineEnd, 0, totalTimeInSeconds));
    }
}

// Transition increase size for video
function increaseVideoSize() {
    let video = select('#moviePlayer');
    if (videoWidthPlayCounter < videoWidthOnPlay) {
        videoWidthPlayCounter += videoTransitionCounter;
        video.style('width', videoWidthPlayCounter + '');
    }
    if (videoHeightPlayCounter < videoHeightOnPlay) {
        videoHeightPlayCounter += videoTransitionCounter;
        video.style('height', videoHeightPlayCounter + '');
    }
    videoPlayer.unMute();
}

// Transition decrease size for video
function decreaseVideoSize() {
    let video = select('#moviePlayer');
    if (videoWidthPlayCounter > videoWidthOnPause) {
        videoWidthPlayCounter -= videoTransitionCounter;
        video.style('width', videoWidthPlayCounter + '');
    }
    if (videoHeightPlayCounter > videoHeightOnPause) {
        videoHeightPlayCounter -= videoTransitionCounter;
        video.style('height', videoHeightPlayCounter + '');
    }
    videoPlayer.mute();
}

// Plays/pauses video and sets boolean videoIsPlaying
function playPauseMovie() {
    if (videoIsPlaying) {
        videoPlayer.pause();
        videoIsPlaying = false;
    } else {
        videoPlayer.play();
        videoPlayer.seekTo(videoCurrTime);
        videoIsPlaying = true;
    }
}
