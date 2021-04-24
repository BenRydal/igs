function setMovementAndConversationData() {
    let drawConversationData = new DrawDataConversation();
    let drawMovementData = new DrawDataMovement();
    for (let i = 0; i < paths.length; i++) {
        if (paths[i].show) {
            drawConversationData.setData(paths[i]);
            drawMovementData.setData(paths[i]); // draw after conversation so bug displays on top
        }
    }
    if (overRect(timelineStart, 0, timelineLength, timelineHeight)) drawMovementData.drawSlicer(); // draw slicer line after calculating all movement
    drawConversationData.setConversationBubble(); // draw conversation text last so it displays on top
    if (animation) setUpAnimation();
}

function setMovementData() {
    let drawMovementData = new DrawDataMovement();
    for (let i = 0; i < paths.length; i++) {
        if (paths[i].show) drawMovementData.setData(paths[i]); // draw after conversation so bug displays on top
    }
    if (overRect(timelineStart, 0, timelineLength, timelineHeight)) drawMovementData.drawSlicer(); // draw slicer line after calculating all movement
    if (animation) setUpAnimation();
}

function setUpAnimation() {
    let animationIncrementRateDivisor = 1000; // this seems to work best
    // Get amount of time in seconds currently displayed
    let curTimeIntervalInSeconds = map(currPixelTimeMax, timelineStart, timelineEnd, 0, totalTimeInSeconds) - map(currPixelTimeMin, timelineStart, timelineEnd, 0, totalTimeInSeconds);
    // set increment value based on that value/divisor to keep constant animation speed regardless of time interval selected
    let animationIncrementValue = curTimeIntervalInSeconds / animationIncrementRateDivisor;
    if (animationCounter < map(currPixelTimeMax, timelineStart, timelineEnd, 0, totalTimeInSeconds)) animationCounter += animationIncrementValue; // updates animation
    else animation = false;
}

// Updates time selected in video depending on mouse position or animation over timeline
function setVideoScrubbing() {
    if (animation) {
        let startValue = map(currPixelTimeMin, timelineStart, timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())); // remap starting point to seek for video
        let endValue = map(currPixelTimeMax, timelineStart, timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())); // remap starting point to seek for video
        let vPos = Math.floor(map(bugTimePosForVideoScrubbing, timelineStart, timelineEnd, startValue, endValue));
        videoPlayer.seekTo(vPos);
    } else if (overRect(timelineStart, 0, timelineEnd, timelineHeight)) {
        let mPos = map(mouseX, timelineStart, timelineEnd, currPixelTimeMin, currPixelTimeMax); // first map mouse to selected time values in GUI
        // must floor vPos to prevent double finite error
        let vPos = Math.floor(map(mPos, timelineStart, timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())));
        videoPlayer.seekTo(vPos);
    }
}

function setGUI() {
    timelineStart = width * 0.4638;
    timelineEnd = width * 0.9638;
    timelineLength = timelineEnd - timelineStart;
    timelineHeight = height * .81;
    displayFloorPlanWidth = timelineStart - (width - timelineEnd);
    displayFloorPlanHeight = timelineHeight;
    currPixelTimeMin = timelineStart; // adjustable timeline values
    currPixelTimeMax = timelineEnd;
    yPosTimelineTop = timelineHeight - tickHeight;
    yPosTimelineBottom = timelineHeight + tickHeight;
    timelineThickness = yPosTimelineBottom - yPosTimelineTop;
    buttonSpacing = width / 71;
    buttonWidth = buttonSpacing;
    speakerKeysHeight = timelineHeight + (height - timelineHeight) / 4;
    buttonsHeight = timelineHeight + (height - timelineHeight) / 1.8;
    keyTextSize = width / 70;
    videoWidth = width / 5;
    videoHeight = width / 6;
}