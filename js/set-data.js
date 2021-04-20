function setUpAnimation() {
    let animationIncrementRateDivisor = 1000; // this seems to work best
    // Get amount of time in seconds currently displayed
    let curTimeIntervalInSeconds = map(currPixelTimeMax, timelineStart, timelineEnd, 0, totalTimeInSeconds) - map(currPixelTimeMin, timelineStart, timelineEnd, 0, totalTimeInSeconds);
    // set increment value based on that value/divisor to keep constant animation speed regardless of time interval selected
    let animationIncrementValue = curTimeIntervalInSeconds / animationIncrementRateDivisor;
    if (animationCounter < map(currPixelTimeMax, timelineStart, timelineEnd, 0, totalTimeInSeconds)) animationCounter += animationIncrementValue; // updates animation
    else animation = false;
}

function setGUI() {
    setBaseValues();
    setTextSizes();
    setConversationValues();
    setInitialVideoValues();
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
    textBoxWidth = width / 3; // width of text and textbox drawn
    textSpacing = width / 57; // textbox leading
    boxSpacing = width / 141; // general textBox spacing variable
    boxDistFromRect = width / 28.2; // distance from text rectangle of textbox
}


function setInitialVideoValues() {
    videoWidth = width / 5;
    videoHeight = width / 6;
    let video = select('#moviePlayer').position(timelineStart, 0); // position video in upper left corner on timeline
    let iFrameID = document.getElementById('moviePlayer');
    iFrameID.width = videoWidth;
    iFrameID.height = videoHeight;
}