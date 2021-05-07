/**
 * Organizes mousePressed method calls for video, movement/conversation and interaction buttons and path/speaker keys
 */
function mousePressed() {
    // Controls video when clicking over timeline region
    if (videoIsShowing && !animation && overRect(timelineStart, 0, timelineEnd, yPosTimelineBottom)) playPauseMovie();
    overMovementConversationButtons();
    overInteractionButtons();
    if (showMovementKeys) overPathKeys();
    else overSpeakerKeys();
}
/**
 * Organizes timeline GUI methods. SelSpacing used to provide additionl "cushion" for mouse.
 * NOTE: To activate timeline methods, animation mode must be false and 
 * Either mouse already dragging over timeline OR mouse cursor is over timeline bar.
 */
function mouseDragged() {
    if (!animation && ((lockedLeft || lockedRight) || overRect(timelineStart - selSpacing, yPosTimelineTop, timelineLength + selSpacing, timelineThickness))) handleTimeline();
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
    textSize(keyTextSize);
    let currXPos = timelineStart;
    if (overRect(currXPos, speakerKeysHeight, buttonWidth + textWidth("Movement"), buttonWidth)) showMovementKeys = true;
    else if (overRect(currXPos + textWidth("Movement | "), speakerKeysHeight, buttonWidth + textWidth("Conversation"), buttonWidth)) showMovementKeys = false;
}

/**
 * Iterate over global speakerList and test if mouse is over any of speaker keys and update speaker accordingly
 * NOTE: textSize is way to control dynamic scaling for gui methods and interface
 */
function overSpeakerKeys() {
    textSize(keyTextSize);
    let currXPos = timelineStart + textWidth("Movement | Conversation") + buttonWidth;
    for (let i = 0; i < speakerList.length; i++) {
        let nameWidth = textWidth(speakerList[i].name); // set nameWidth to pixel width of speaker code
        if (overRect(currXPos, speakerKeysHeight, buttonWidth + nameWidth, buttonWidth)) speakerList[i].show = !speakerList[i].show;
        currXPos += buttonWidth + nameWidth + buttonSpacing;
    }
}

/**
 * Iterate over global paths list and test if mouse is over any of paths and update accordingly
 * NOTE: textSize is way to control dynamic scaling for gui methods and interface
 */
function overPathKeys() {
    textSize(keyTextSize);
    let currXPos = timelineStart + textWidth("Movement | Conversation") + buttonWidth;
    for (let i = 0; i < paths.length; i++) {
        const nameWidth = textWidth(paths[i].name); // set nameWidth to pixel width of path name
        if (overRect(currXPos, speakerKeysHeight, buttonWidth + nameWidth, buttonWidth)) paths[i].show = !paths[i].show;
        currXPos += buttonWidth + nameWidth + buttonSpacing;
    }
}

/**
 * Iterate over each interaction button and toggle boolean or call corresponding gui method for button
 * NOTE: textSize is way to control dynamic scaling for gui methods and interface
 */
function overInteractionButtons() {
    textSize(keyTextSize);
    let currXPos = timelineStart + buttonSpacing / 2;
    if (overRect(currXPos, buttonsHeight, textWidth(buttons[0]), buttonWidth)) overAnimateButton();
    else if (overRect(currXPos + textWidth(buttons[0]) + 2 * buttonSpacing, buttonsHeight, textWidth(buttons[1]) + buttonSpacing, buttonWidth)) conversationPositionTop = !conversationPositionTop;
    else if (overRect(currXPos + textWidth(buttons[0] + buttons[1]) + 4 * buttonSpacing, buttonsHeight, textWidth(buttons[2]) + buttonSpacing, buttonWidth)) allConversation = !allConversation;
    else if (dataIsLoaded(videoPlayer) && overRect(currXPos + textWidth(buttons[0] + buttons[1] + buttons[2]) + 6 * buttonSpacing, buttonsHeight, textWidth(buttons[3]) + buttonSpacing, buttonWidth)) overVideoButton();
    else if (overRect(currXPos + textWidth(buttons[0] + buttons[1] + buttons[2] + buttons[3]) + 8 * buttonSpacing, buttonsHeight, textWidth(buttons[4]) + buttonSpacing, buttonWidth)) showIntroMsg = !showIntroMsg;
}

/**
 * Toggle on and off animation mode and set/end global animation counter variable
 */
function overAnimateButton() {
    if (animation) {
        animation = false;
        animationCounter = map(currPixelTimeMax, timelineStart, timelineEnd, 0, totalTimeInSeconds); // set to currPixelTimeMax mapped value
    } else {
        animation = true;
        animationCounter = map(currPixelTimeMin, timelineStart, timelineEnd, 0, totalTimeInSeconds); // set to currPixelTimeMin mapped value
    }
}

/**
 * Updates currPixelTimeMin or currPixelTimeMax global variables depending on left or right selector that user is over
 * NOTE: Is triggered if user already dragging or begins dragging
 */
function handleTimeline() {
    const xPosLeftSelector = currPixelTimeMin;
    const xPosRightSelector = currPixelTimeMax;
    if (lockedLeft || (!lockedRight && overRect(xPosLeftSelector - selSpacing, yPosTimelineTop, 2 * selSpacing, timelineThickness))) {
        lockedLeft = true;
        currPixelTimeMin = constrain(mouseX, timelineStart, timelineEnd);
        if (currPixelTimeMin > currPixelTimeMax - (2 * selSpacing)) currPixelTimeMin = currPixelTimeMax - (2 * selSpacing); // prevents overstriking
    } else if (lockedRight || overRect(xPosRightSelector - selSpacing, yPosTimelineTop, 2 * selSpacing, timelineThickness)) {
        lockedRight = true;
        currPixelTimeMax = constrain(mouseX, timelineStart, timelineEnd);
        if (currPixelTimeMax < currPixelTimeMin + (2 * selSpacing)) currPixelTimeMax = currPixelTimeMin + (2 * selSpacing); // prevents overstriking
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
        const mapMousePos = map(mouseX, timelineStart, timelineEnd, currPixelTimeMin, currPixelTimeMax);
        // must floor vPos to prevent double finite error
        const videoPos = Math.floor(map(mapMousePos, timelineStart, timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())));
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