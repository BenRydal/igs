function mousePressed() {
    // Controls video when clicking on timeline
    if (videoIsShowing && !animation && overRect(timelineStart, 0, timelineEnd, timelineHeight - tickHeight)) playPauseMovie();
    textSize(keyTextSize);
    overMovementConversationKeys();
    if (movementKeyTitle) overPathKeys();
    else overSpeakerKeys();
    overInteractionButtons();
    if (!animation && overRect(timelineStart, yPosTimeScaleTop, timelineLength, yPosTimeScaleSize)) handleTimeline();
}

function mouseDragged() {
    if (!animation) {
        if (lockedLeft || lockedRight) handleTimeline();
        else if (overRect(timelineStart, yPosTimeScaleTop, timelineLength, yPosTimeScaleSize)) handleTimeline();
    }
}

function mouseReleased() {
    lockedLeft = false;
    lockedRight = false;
}

function overMovementConversationKeys() {
    let currXPos = timelineStart;
    if (overRect(currXPos, speakerKeysHeight, buttonWidth + textWidth("Movement"), buttonWidth)) movementKeyTitle = true;
    else if (overRect(currXPos + textWidth("Movement | "), speakerKeysHeight, buttonWidth + textWidth("Conversation"), buttonWidth)) movementKeyTitle = false;
}

// Loop through speakerList and test if over any of speaker keys and update speaker accordingly
function overSpeakerKeys() {
    let currXPos = timelineStart + textWidth("Movement | Conversation") + buttonWidth;
    for (let i = 0; i < speakerList.length; i++) {
        let nameWidth = textWidth(speakerList[i].name); // set nameWidth to pixel width of speaker code
        if (overRect(currXPos, speakerKeysHeight, buttonWidth + nameWidth, buttonWidth)) speakerList[i].show = !speakerList[i].show;
        currXPos += buttonWidth + nameWidth + buttonSpacing;
    }
}

function overPathKeys() {
    let currXPos = timelineStart + textWidth("Movement | Conversation") + buttonWidth;
    for (let i = 0; i < paths.length; i++) {
        let nameWidth = textWidth(paths[i].name); // set nameWidth to pixel width of path name
        if (overRect(currXPos, speakerKeysHeight, buttonWidth + nameWidth, buttonWidth)) paths[i].show = !paths[i].show;
        currXPos += buttonWidth + nameWidth + buttonSpacing;
    }
}

// Loop through all button/test if mouse clicked and update accordingly
function overInteractionButtons() {
    let currXPos = timelineStart + buttonSpacing / 2;
    if (overRect(currXPos, buttonsHeight, textWidth(buttons[0]), buttonWidth)) overAnimateButton();
    else if (overRect(currXPos + textWidth(buttons[0]) + 2 * buttonSpacing, buttonsHeight, textWidth(buttons[1]) + buttonSpacing, buttonWidth)) conversationPositionTop = !conversationPositionTop;
    else if (overRect(currXPos + textWidth(buttons[0] + buttons[1]) + 4 * buttonSpacing, buttonsHeight, textWidth(buttons[2]) + buttonSpacing, buttonWidth)) allConversation = !allConversation;
    else if (videoPlayer !== undefined && overRect(currXPos + textWidth(buttons[0] + buttons[1] + buttons[2]) + 6 * buttonSpacing, buttonsHeight, textWidth(buttons[3]) + buttonSpacing, buttonWidth)) overVideoButton();
    else if (overRect(currXPos + textWidth(buttons[0] + buttons[1] + buttons[2] + buttons[3]) + 8 * buttonSpacing, buttonsHeight, textWidth(buttons[4]) + buttonSpacing, buttonWidth)) showIntroMsg = !showIntroMsg;
}

function overAnimateButton() {
    if (animation) {
        animation = false;
        animationCounter = map(currPixelTimeMax, timelineStart, timelineEnd, 0, totalTimeInSeconds); // set to currPixelTimeMax mapped value
    } else {
        animation = true;
        animationCounter = map(currPixelTimeMin, timelineStart, timelineEnd, 0, totalTimeInSeconds); // set to currPixelTimeMin mapped value
    }
}

function handleTimeline() {
    let xPosLeftSelector = currPixelTimeMin;
    let xPosRightSelector = currPixelTimeMax;

    // 3 types of selection that work together
    if (lockedLeft || (!lockedRight && overRect(xPosLeftSelector - selSpacing, yPosTimeScaleTop, 2 * selSpacing, yPosTimeScaleSize))) {
        lockedLeft = true;
        currPixelTimeMin = constrain(mouseX, timelineStart, timelineEnd);
        if (currPixelTimeMin > currPixelTimeMax - (2 * selSpacing)) currPixelTimeMin = currPixelTimeMax - (2 * selSpacing); // prevents overstriking
    } else if (lockedRight || overRect(xPosRightSelector - selSpacing, yPosTimeScaleTop, 2 * selSpacing, yPosTimeScaleSize)) {
        lockedRight = true;
        currPixelTimeMax = constrain(mouseX, timelineStart, timelineEnd);
        if (currPixelTimeMax < currPixelTimeMin + (2 * selSpacing)) currPixelTimeMax = currPixelTimeMin + (2 * selSpacing); // prevents overstriking
    }
}

// VIDEO
function overVideoButton() {
    if (videoIsShowing) {
        videoPlayer.pause();
        videoPlayer.hide();
        videoIsPlaying = false; // important to set this
    } else {
        videoPlayer.show();
    }
    videoIsShowing = !videoIsShowing;
}

// Plays/pauses video and toggles videoIsPlaying
function playPauseMovie() {
    if (videoIsPlaying) {
        videoPlayer.pause();
        videoIsPlaying = false;
    } else {
        let mPos = map(mouseX, timelineStart, timelineEnd, currPixelTimeMin, currPixelTimeMax); // first map mouse to selected time values in GUI
        // must floor vPos to prevent double finite error
        let vPos = Math.floor(map(mPos, timelineStart, timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())));
        videoPlayer.play();
        videoPlayer.seekTo(vPos);
        videoIsPlaying = true;
    }
}

// Tests if over circle with x, y and diameter
function overCircle(x, y, diameter) {
    let disX = x - mouseX;
    let disY = y - mouseY;
    return sqrt(sq(disX) + sq(disY)) < diameter / 2;
}

// Tests if over rectangle with x, y, and width/height
function overRect(x, y, boxWidth, boxHeight) {
    return mouseX >= x && mouseX <= x + boxWidth && mouseY >= y && mouseY <= y + boxHeight;
}