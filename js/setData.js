function setGUI() {
    setBaseValues();
    setTextSizes();
    setConversationValues();
    setVideoValues();
}

function setBaseValues() {
    timelineStart = width * 0.4638;
    timelineEnd = width * 0.9638;
    timelineLength = timelineEnd - timelineStart;
    timelineHeight = height * .81;
    displayFloorPlanWidth = timelineStart - (width - timelineEnd);
    displayFloorPlanHeight = timelineHeight;
    currPixelTimeMin = timelineStart; // adjustable timeline values
    currPixelTimeMax = timelineEnd;
    yPosTimeScaleTop = timelineHeight - tickHeight;
    yPosTimeScaleBottom = timelineHeight + tickHeight;
    yPosTimeScaleSize = 2 * tickHeight;
    buttonSpacing = width / 71;
    buttonWidth = buttonSpacing;
    speakerKeysHeight = timelineHeight + (height - timelineHeight) / 4;
    buttonsHeight = timelineHeight + (height - timelineHeight) / 1.8;
    bugPrecision = 3;
    bugSize = width / 56;
}

function setTextSizes() {
    keyTextSize = width / 70;
    titleTextSize = width / 55;
    infoTextSize = width / 100;
}

function setConversationValues() {
    textBoxWidth = width / 3.5; // width of text and textbox drawn
    textSpacing = width / 57; // textbox leading
    boxSpacing = width / 141; // general textBox spacing variable
    boxDistFromRect = width / 28.2; // distance from text rectangle of textbox
}

function setVideoValues() {
    let video = select('#moviePlayer').position(timelineStart, 0); // position video in upper left corner on timeline
    videoWidthOnPause = width / 5;
    videoHeightOnPause = width / 6;
    videoWidthOnPlay = width - timelineStart;
    videoHeightOnPlay = height * .74;
    videoWidthPlayCounter = videoWidthOnPause;
    videoHeightPlayCounter = videoHeightOnPause;
}

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