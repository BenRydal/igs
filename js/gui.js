function mousePressed() {
    if (intro) intro = false;
    // Controls video when clicking on timeline
    if (videoMode && !animation && overRect(timelineStart, 0, timelineEnd, timelineHeight - tickHeight)) {
        let initialValue = map(mouseX, timelineStart, timelineEnd, currPixelTimeMin, currPixelTimeMax); // first map mouse to selected time values in GUI
        videoCurrTime = map(initialValue, timelineStart, timelineEnd, 0, totalTimeInSeconds);
        playPauseMovie();
    }
    textSize(keyTextSize);
    overMovementKeyTitle();
    if (movementKeyTitle) overPathKeys();
    else overSpeakerKeys();
    overButtons();
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

function overMovementKeyTitle() {
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
function overButtons() {
    let currXPos = timelineStart + buttonSpacing / 2;
    if (overRect(currXPos, buttonsHeight, textWidth(button_1), buttonWidth)) overAnimateButton();
    else if (overRect(currXPos + textWidth(button_1) + 2 * buttonSpacing, buttonsHeight, textWidth(button_2) + buttonSpacing, buttonWidth)) conversationPositionTop = !conversationPositionTop;
    else if (overRect(currXPos + textWidth(button_1 + button_2) + 4 * buttonSpacing, buttonsHeight, textWidth(button_3) + buttonSpacing, buttonWidth)) allConversation = !allConversation;
    else if (overRect(currXPos + textWidth(button_1 + button_2 + button_3) + 6 * buttonSpacing, buttonsHeight, textWidth(button_4) + buttonSpacing, buttonWidth)) {
        videoMode = !videoMode;
        let video = select('#moviePlayer');
        video.style('display', (videoMode ? 'block' : 'none'));
        if (videoMode) {
            video.style('width', videoWidthOnPause + ''); // reset width/height
            video.style('height', videoHeightOnPause + '');
        } else {
            videoCurrTime = 0; // reset time to 0
            pauseMovie();
        }
    } else if (overRect(currXPos + textWidth(button_1 + button_2 + button_3 + button_4) + 8 * buttonSpacing, buttonsHeight, textWidth(button_5) + buttonSpacing, buttonWidth)) overHowToReadButton();

}

// Test if over buttons and send to drawKeyMessages with respective String/message
function overButtonsMSGS() {
    textSize(keyTextSize);
    textFont(font_PlayfairReg);
    noStroke();
    let currXPos = timelineStart + buttonSpacing / 2;
    if (overRect(currXPos, buttonsHeight, textWidth(button_1), buttonWidth)) drawKeyMSG(animateMSG);
    else if (overRect(currXPos + textWidth(button_1) + 2 * buttonSpacing, buttonsHeight, textWidth(button_2) + buttonSpacing, buttonWidth)) drawKeyMSG(conversation_1_MSG);
    else if (overRect(currXPos + textWidth(button_1 + button_2) + 4 * buttonSpacing, buttonsHeight, textWidth(button_3) + buttonSpacing, buttonWidth)) drawKeyMSG(conversation_2_MSG);
    else if (overRect(currXPos + textWidth(button_1 + button_2 + button_3) + 6 * buttonSpacing, buttonsHeight, textWidth(button_4) + buttonSpacing, buttonWidth)) drawKeyMSG(videoMSG);
    else if (overRect(currXPos + textWidth(button_1 + button_2 + button_3 + button_4) + 8 * buttonSpacing, buttonsHeight, textWidth(button_5) + buttonSpacing, buttonWidth)) drawHowToReadMSG(); // draw how to read message differently
}

// Draw text for button message/information
function drawKeyMSG(msg) {
    let textBoxHeight = textSpacing * (ceil(textWidth(msg) / textBoxWidth)); // lines of talk in a text box rounded
    let textBoxStart = speakerKeysHeight - (textBoxHeight + 2 * boxSpacing);
    let yPosBubble = textBoxStart + textBoxHeight + 2 * boxSpacing;
    stroke(0);
    strokeWeight(1);
    fill(255, 225); // transparency for textbox
    let xPos = 0;
    if (width - mouseX < textBoxWidth / 2) xPos = width - textBoxWidth / 2 - 2 * boxSpacing;
    else xPos = mouseX;
    rect(xPos - boxSpacing - textBoxWidth / 2, textBoxStart, textBoxWidth + 2 * boxSpacing, textBoxHeight + 2 * boxSpacing);
    fill(0);
    noStroke();
    text(msg, xPos - textBoxWidth / 2, textBoxStart + boxSpacing, textBoxWidth, textBoxWidth);
    // lines for cartoon bubble
    stroke(255);
    strokeWeight(2);
    line(mouseX - (3 * buttonSpacing), yPosBubble, mouseX - buttonSpacing, yPosBubble);
    stroke(0);
    strokeWeight(1);
    line(mouseX, buttonsHeight, mouseX - (3 * buttonSpacing), yPosBubble);
    line(mouseX, buttonsHeight, mouseX - buttonSpacing, yPosBubble);
}

function drawHowToReadMSG() {
    let textBoxHeight = textSpacing * (ceil(textWidth(howToReadMSG_1) / textBoxWidth)); // lines of talk in a text box rounded
    let textBoxStart = height / 5;
    let xPos = width / 2.1;
    stroke(0); //set color to black
    strokeWeight(1);
    fill(255, 225); // transparency for textbox
    rect(xPos - boxSpacing, textBoxStart, textBoxWidth + 2 * boxSpacing, textBoxHeight + 2 * boxSpacing);
    fill(0);
    noStroke();
    text(howToReadMSG_1, xPos, textBoxStart + boxSpacing, textBoxWidth, textBoxWidth); // draw message in space-tiem view
    drawKeyMSG(howToReadMSG_2); // draw message above how to read button
}

// Draw text for intro message
function drawIntroMSG(msg) {
    textSize(keyTextSize);
    textFont(font_PlayfairReg);
    let textBoxHeight = textSpacing * (ceil(textWidth(msg) / textBoxWidth)); // lines of talk in a text box rounded
    let textBoxStart = speakerKeysHeight - (textBoxHeight + 2 * boxSpacing);
    let yPosBubble = textBoxStart + textBoxHeight + 2 * boxSpacing;
    stroke(0);
    strokeWeight(1);
    fill(255, 225); // transparency for textbox
    let xPos = width - textBoxWidth / 2 - 2 * boxSpacing;
    rect(xPos - boxSpacing - textBoxWidth / 2, textBoxStart, textBoxWidth + 2 * boxSpacing, textBoxHeight + 2 * boxSpacing);
    fill(0);
    noStroke();
    text(msg, xPos - textBoxWidth / 2, textBoxStart + boxSpacing, textBoxWidth, textBoxWidth);
    let xPosBubble = width - textBoxWidth / 3;
    // lines for cartoon bubble
    stroke(255);
    strokeWeight(2);
    line(xPosBubble - (3 * buttonSpacing), yPosBubble, xPosBubble - buttonSpacing, yPosBubble);
    stroke(0);
    strokeWeight(1);
    line(xPosBubble, buttonsHeight, xPosBubble - (3 * buttonSpacing), yPosBubble);
    line(xPosBubble, buttonsHeight, xPosBubble - buttonSpacing, yPosBubble);
}


function overHowToReadButton() {
    if (!howToRead) {
        for (let i = 0; i < paths.length; i++) {
            let path = paths[i];
            if (path.speaker != 'T') path.show = false;
            else path.show = true; // ensure teacher path is showed
        }
        conversationPositionTop = false; // hide conversation if showing
        allConversation = false;
    }
    howToRead = !howToRead;
}

function overAnimateButton() {
    if (animation) {
        animation = false;
        let initialValue = map(currPixelTimeMax, timelineStart, timelineEnd, 0, animationMaxValue);
        animationCounter = animationMaxValue;
    } else {
        animation = true;
        let initialValue = map(currPixelTimeMin, timelineStart, timelineEnd, 0, animationMaxValue);
        animationCounter = initialValue; // reset animation if playing/already played
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

// Tests if over circle with x, y and diameter
function overCircle(x, y, diameter) {
    let disX = x - mouseX;
    let disY = y - mouseY;
    if (sqrt(sq(disX) + sq(disY)) < diameter / 2) {
        return true;
    } else {
        return false;
    }
}

// Tests if over rectangle with x, y, and width/height
function overRect(x, y, boxWidth, boxHeight) {
    if (mouseX >= x && mouseX <= x + boxWidth &&
        mouseY >= y && mouseY <= y + boxHeight) {
        return true;
    } else {
        return false;
    }
}