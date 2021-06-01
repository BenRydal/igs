/**
 * Organizes mousePressed method calls for video, movement/conversation and interaction buttons and path/speaker keys
 */
function mousePressed() {
    // Controls video when clicking over timeline region
    if (videoIsShowing && !animation && overRect(keys.timelineStart, 0, keys.timelineEnd, keys.yPosTimelineBottom)) playPauseMovie();
    overMovementConversationButtons();
    overInteractionButtons();
    if (showMovementKeys) overPathKeys();
    else overSpeakerKeys();
}
/**
 * Organizes timeline GUI methods. SELPADDING used to provide additionl "cushion" for mouse.
 * NOTE: To activate timeline methods, animation mode must be false and 
 * Either mouse already dragging over timeline OR mouse cursor is over timeline bar.
 */
function mouseDragged() {
    if (!animation && ((lockedLeft || lockedRight) || overRect(keys.timelineStart - SELPADDING, keys.yPosTimelineTop, keys.timelineLength + SELPADDING, keys.timelineThickness))) handleTimeline();
}
/**
 * Set locked global vars to false to be able to re-engage timeline GUI methods
 */
function mouseReleased() {
    lockedLeft = false;
    lockedRight = false;
}
/**
 * Toggles on and off global showMovement var to determine if movement or conversation keys show
 * NOTE: textSize is way to control dynamic scaling for gui methods and interface
 */
function overMovementConversationButtons() {
    textSize(keys.keyTextSize);
    let currXPos = keys.timelineStart;
    if (overRect(currXPos, keys.speakerKeysHeight, keys.buttonWidth + textWidth("Movement"), keys.buttonWidth)) showMovementKeys = true;
    else if (overRect(currXPos + textWidth("Movement | "), keys.speakerKeysHeight, keys.buttonWidth + textWidth("Conversation"), keys.buttonWidth)) showMovementKeys = false;
}

/**
 * Iterate over global speakerList and test if mouse is over any of speaker keys and update speaker accordingly
 * NOTE: textSize is way to control dynamic scaling for gui methods and interface
 */
function overSpeakerKeys() {
    textSize(keys.keyTextSize);
    let currXPos = keys.timelineStart + textWidth("Movement | Conversation") + keys.buttonWidth;
    for (let i = 0; i < speakerList.length; i++) {
        let nameWidth = textWidth(speakerList[i].name); // set nameWidth to pixel width of speaker code
        if (overRect(currXPos, keys.speakerKeysHeight, keys.buttonWidth + nameWidth, keys.buttonWidth)) speakerList[i].show = !speakerList[i].show;
        currXPos += keys.buttonWidth + nameWidth + keys.buttonSpacing;
    }
}

/**
 * Iterate over global paths list and test if mouse is over any of paths and update accordingly
 * NOTE: textSize is way to control dynamic scaling for gui methods and interface
 */
function overPathKeys() {
    textSize(keys.keyTextSize);
    let currXPos = keys.timelineStart + textWidth("Movement | Conversation") + keys.buttonWidth;
    for (let i = 0; i < paths.length; i++) {
        const nameWidth = textWidth(paths[i].name); // set nameWidth to pixel width of path name
        if (overRect(currXPos, keys.speakerKeysHeight, keys.buttonWidth + nameWidth, keys.buttonWidth)) paths[i].show = !paths[i].show;
        currXPos += keys.buttonWidth + nameWidth + keys.buttonSpacing;
    }
}

/**
 * Iterate over each interaction button and toggle boolean or call corresponding gui method for button
 * NOTE: textSize is way to control dynamic scaling for gui methods and interface
 */
function overInteractionButtons() {
    textSize(keys.keyTextSize);
    let currXPos = keys.timelineStart + keys.buttonSpacing / 2;
    if (overRect(currXPos, keys.buttonsHeight, textWidth(buttons[0]), keys.buttonWidth)) overAnimateButton();
    else if (overRect(currXPos + textWidth(buttons[0]) + 2 * keys.buttonSpacing, keys.buttonsHeight, textWidth(buttons[1]) + keys.buttonSpacing, keys.buttonWidth)) conversationPositionTop = !conversationPositionTop;
    else if (overRect(currXPos + textWidth(buttons[0] + buttons[1]) + 4 * keys.buttonSpacing, keys.buttonsHeight, textWidth(buttons[2]) + keys.buttonSpacing, keys.buttonWidth)) allConversation = !allConversation;
    else if (dataIsLoaded(videoPlayer) && overRect(currXPos + textWidth(buttons[0] + buttons[1] + buttons[2]) + 6 * keys.buttonSpacing, keys.buttonsHeight, textWidth(buttons[3]) + keys.buttonSpacing, keys.buttonWidth)) overVideoButton();
    else if (overRect(currXPos + textWidth(buttons[0] + buttons[1] + buttons[2] + buttons[3]) + 8 * keys.buttonSpacing, keys.buttonsHeight, textWidth(buttons[4]) + keys.buttonSpacing, keys.buttonWidth)) showIntroMsg = !showIntroMsg;
}

/**
 * Toggle on and off animation mode and set/end global animation counter variable
 */
function overAnimateButton() {
    if (animation) {
        animation = false;
        animationCounter = map(keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd, 0, totalTimeInSeconds); // set to keys.curPixelTimeMax mapped value
    } else {
        animation = true;
        animationCounter = map(keys.curPixelTimeMin, keys.timelineStart, keys.timelineEnd, 0, totalTimeInSeconds); // set to keys.curPixelTimeMin mapped value
    }
}

/**
 * Updates keys.curPixelTimeMin or keys.curPixelTimeMax global variables depending on left or right selector that user is over
 * NOTE: Is triggered if user already dragging or begins dragging
 */
function handleTimeline() {
    const xPosLeftSelector = keys.curPixelTimeMin;
    const xPosRightSelector = keys.curPixelTimeMax;
    if (lockedLeft || (!lockedRight && overRect(xPosLeftSelector - SELPADDING, keys.yPosTimelineTop, 2 * SELPADDING, keys.timelineThickness))) {
        lockedLeft = true;
        keys.curPixelTimeMin = constrain(mouseX, keys.timelineStart, keys.timelineEnd);
        if (keys.curPixelTimeMin > keys.curPixelTimeMax - (2 * SELPADDING)) keys.curPixelTimeMin = keys.curPixelTimeMax - (2 * SELPADDING); // prevents overstriking
    } else if (lockedRight || overRect(xPosRightSelector - SELPADDING, keys.yPosTimelineTop, 2 * SELPADDING, keys.timelineThickness)) {
        lockedRight = true;
        keys.curPixelTimeMax = constrain(mouseX, keys.timelineStart, keys.timelineEnd);
        if (keys.curPixelTimeMax < keys.curPixelTimeMin + (2 * SELPADDING)) keys.curPixelTimeMax = keys.curPixelTimeMin + (2 * SELPADDING); // prevents overstriking
    }
}

/**
 * Toggle whether video is playing and whether video is showing
 * NOTE: this is different than playPauseMovie method
 */
function overVideoButton() {
    if (videoIsShowing) {
        videoPlayer.pause();
        videoPlayer.hide();
        videoIsPlaying = false; // important to set this
    } else {
        videoPlayer.show();
    }
    videoIsShowing = !videoIsShowing; // set after testing
}

/**
 * Plays/pauses movie and updates videoPlayhead if setting to play
 * Also toggles global videoIsPlaying variable
 */
function playPauseMovie() {
    if (videoIsPlaying) {
        videoPlayer.pause();
        videoIsPlaying = false;
    } else {
        // first map mouse to selected time values in GUI
        const mapMousePos = map(mouseX, keys.timelineStart, keys.timelineEnd, keys.curPixelTimeMin, keys.curPixelTimeMax);
        // must floor vPos to prevent double finite error
        const videoPos = Math.floor(map(mapMousePos, keys.timelineStart, keys.timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())));
        videoPlayer.play();
        videoPlayer.seekTo(videoPos);
        videoIsPlaying = true;
    }
}

function overCircle(x, y, diameter) {
    const disX = x - mouseX;
    const disY = y - mouseY;
    return sqrt(sq(disX) + sq(disY)) < diameter / 2;
}

// Tests if over rectangle with x, y, and width/height
function overRect(x, y, boxWidth, boxHeight) {
    return mouseX >= x && mouseX <= x + boxWidth && mouseY >= y && mouseY <= y + boxHeight;
}