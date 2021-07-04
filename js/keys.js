class Keys {

    constructor() {
        this.timelineStart = width * 0.4638;
        this.timelineEnd = width * 0.9638;
        this.tickHeight = 25;
        this.curPixelTimeMin = this.timelineStart; // adjustable timeline values
        this.curPixelTimeMax = this.timelineEnd;
        this.timelineLength = this.timelineEnd - this.timelineStart;
        this.timelineHeight = height * .81;
        this.displayFloorPlanWidth = this.timelineStart - (width - this.timelineEnd);
        this.displayFloorPlanHeight = this.timelineHeight;
        this.yPosTimelineTop = this.timelineHeight - this.tickHeight;
        this.yPosTimelineBottom = this.timelineHeight + this.tickHeight;
        this.timelineThickness = this.yPosTimelineBottom - this.yPosTimelineTop;
        this.buttonSpacing = width / 71;
        this.buttonWidth = this.buttonSpacing;
        this.speakerKeysHeight = this.timelineHeight + (height - this.timelineHeight) / 4;
        this.buttonsHeight = this.timelineHeight + (height - this.timelineHeight) / 1.8;
        this.keyTextSize = width / 70;
        this.floorPlanCursorSelectSize = 100;
        this.font_PlayfairReg = loadFont("data/fonts/PlayfairDisplay-Regular.ttf");
        this.font_PlayfairItalic = loadFont("data/fonts/PlayfairDisplay-Italic.ttf");
        this.introMsg = "INTERACTION GEOGRAPHY SLICER (IGS)\n\nby Ben Rydal Shapiro & contributors\nbuilt with p5.js & JavaScript\n\nHi There! This is a tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan view (left) and a space-time view (right), where the vertical axis corresponds to the vertical dimension of the floor plan. Use the top menu to visualize different sample datasets or upload your own data. Hover over the floor plan and use the timeline to selectively study displayed data. Use the bottom buttons to animate data, visualize conversation in different ways, and interact with video data by clicking the timeline to play & pause video. For more information see: benrydal.com/software/igs";

        this.BUTTON_NAMES = ["Animate", "Align Talk", "All Talk", "Video", "How to Use"];

        this.lockedLeft = false;
        this.lockedRight = false;
        this.selPadding = 20; // cushion for user selection on timeline
    }

    drawKeys() {
        textAlign(LEFT, TOP);
        textFont(this.font_PlayfairReg, this.keyTextSize);
        this.drawPathSpeakerTitle();
        if (core.isModeMovement) this.drawPathSpeakerKeys(core.paths);
        else this.drawPathSpeakerKeys(core.speakerList);
        this.drawTimeline();
        this.drawButtons();
        if (this.overRect(0, 0, this.displayFloorPlanWidth, this.displayFloorPlanHeight)) this.drawFloorPlanSelector();
        if (this.overRect(this.timelineStart, 0, this.timelineLength, this.timelineHeight)) this.drawSlicer(); // draw slicer line after calculating all movement
        if (core.isModeIntro) this.drawIntroMsg(); // draw intro message on program start up until mouse is pressed
    }

    drawPathSpeakerTitle() {
        let currXPos = this.timelineStart;
        let yPos = this.speakerKeysHeight - this.buttonWidth / 5;
        noStroke();
        fill(core.isModeMovement ? 0 : 150);
        text("Movement", currXPos, yPos);
        fill(0);
        text(" | ", currXPos + textWidth("Movement"), yPos);
        fill(!core.isModeMovement ? 0 : 150);
        text("Conversation", currXPos + textWidth("Movement | "), yPos);
    }

    // Loop through speakers and set fill/stroke in keys for all if showing/not showing
    drawPathSpeakerKeys(list) {
        let currXPos = this.timelineStart + textWidth("Movement | Conversation") + this.buttonWidth;
        let yPos = this.speakerKeysHeight - this.buttonWidth / 5;
        strokeWeight(5);
        for (const person of list) {
            stroke(person.color);
            noFill();
            rect(currXPos, this.speakerKeysHeight, this.buttonWidth, this.buttonWidth);
            if (person.show) {
                fill(person.color);
                rect(currXPos, this.speakerKeysHeight, this.buttonWidth, this.buttonWidth);
            }
            fill(0);
            noStroke();
            text(person.name, currXPos + 1.3 * this.buttonWidth, yPos);
            currXPos += this.buttonWidth + textWidth(person.name) + this.buttonSpacing;
        }
    }

    drawButtons() {
        let currXPos = this.timelineStart + this.buttonSpacing / 2;
        fill(core.isModeAnimate ? 0 : 150);
        // Button 1
        text(this.BUTTON_NAMES[0], currXPos, this.buttonsHeight);
        noFill();
        stroke(core.isModeAnimate ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - this.buttonSpacing / 2, this.buttonsHeight, textWidth(this.BUTTON_NAMES[0]) + this.buttonSpacing, this.buttonSpacing * 1.5);
        noStroke();
        currXPos += textWidth(this.BUTTON_NAMES[0]) + this.buttonSpacing * 2;
        // Button 2
        fill(core.isModeAlignTalkTop ? 0 : 150);
        text(this.BUTTON_NAMES[1], currXPos, this.buttonsHeight);
        noFill();
        stroke(core.isModeAlignTalkTop ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - this.buttonSpacing / 2, this.buttonsHeight, textWidth(this.BUTTON_NAMES[1]) + this.buttonSpacing, this.buttonSpacing * 1.5);
        noStroke();
        currXPos += textWidth(this.BUTTON_NAMES[1]) + this.buttonSpacing * 2;
        // Button 3
        fill(core.isModeAllTalkOnPath ? 0 : 150);
        text(this.BUTTON_NAMES[2], currXPos, this.buttonsHeight);
        noFill();
        stroke(core.isModeAllTalkOnPath ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - this.buttonSpacing / 2, this.buttonsHeight, textWidth(this.BUTTON_NAMES[2]) + this.buttonSpacing, this.buttonSpacing * 1.5);
        noStroke();
        currXPos += textWidth(this.BUTTON_NAMES[2]) + this.buttonSpacing * 2;
        // Button 4
        fill(core.isModeVideoShowing ? 0 : 150);
        text(this.BUTTON_NAMES[3], currXPos, this.buttonsHeight);
        noFill();
        stroke(core.isModeVideoShowing ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - this.buttonSpacing / 2, this.buttonsHeight, textWidth(this.BUTTON_NAMES[3]) + this.buttonSpacing, this.buttonSpacing * 1.5);
        noStroke();
        currXPos += textWidth(this.BUTTON_NAMES[3]) + this.buttonSpacing * 2;
        // Button 5
        textFont(this.font_PlayfairItalic, this.keyTextSize);
        fill(core.isModeIntro ? 0 : 150);
        text(this.BUTTON_NAMES[4], currXPos, this.buttonsHeight);
        noFill();
        stroke(core.isModeIntro ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - this.buttonSpacing / 2, this.buttonsHeight, textWidth(this.BUTTON_NAMES[4]) + this.buttonSpacing, this.buttonSpacing * 1.5);
        noStroke();
    }

    drawTimeline() {
        // timeline selection rectangle
        fill(150, 150);
        noStroke();
        if (core.isModeAnimate) rect(this.curPixelTimeMin, this.timelineHeight - this.tickHeight, map(core.animationCounter, 0, core.totalTimeInSeconds, this.timelineStart, this.timelineEnd) - this.curPixelTimeMin, 2 * (this.tickHeight));
        else rect(this.curPixelTimeMin, this.timelineHeight - this.tickHeight, this.curPixelTimeMax - this.curPixelTimeMin, 2 * (this.tickHeight));
        // timeline
        stroke(0);
        strokeWeight(1);
        line(this.timelineStart, this.timelineHeight, this.timelineEnd, this.timelineHeight); // horizontal
        // Selector lines
        strokeWeight(4);
        line(this.curPixelTimeMin, this.timelineHeight - this.tickHeight, this.curPixelTimeMin, this.timelineHeight + this.tickHeight);
        line(this.curPixelTimeMax, this.timelineHeight - this.tickHeight, this.curPixelTimeMax, this.timelineHeight + this.tickHeight);

        // Text for minutes at start/end of timeline
        noStroke();
        fill(0);
        let startValue = floor(map(this.curPixelTimeMin, this.timelineStart, this.timelineEnd, 0, core.totalTimeInSeconds));
        let endValue = ceil(map(this.curPixelTimeMax, this.timelineStart, this.timelineEnd, 0, core.totalTimeInSeconds));
        text(floor(startValue / 60), this.timelineStart + this.tickHeight / 2, this.timelineHeight);
        text(ceil(endValue / 60), this.timelineEnd - this.tickHeight, this.timelineHeight);
        // Text for timeline label
        let mapMouseX = map(mouseX, this.timelineStart, this.timelineEnd, this.curPixelTimeMin, this.curPixelTimeMax);
        let videoTimeInSeconds = map(mapMouseX, this.timelineStart, this.timelineEnd, 0, core.totalTimeInSeconds); // remap to get seconds in video from remapped mouse position   
        let videoTimeInMinutes = videoTimeInSeconds / 60; // float value of minutes and seconds
        let minutesValue = floor(videoTimeInMinutes); // floor to get minutes
        let decimalSeconds = videoTimeInMinutes - minutesValue; //  Subtract minutes to get decimal seconds---e.g., 14.28571429 - 14... returns (.28571429)
        let secondsValue = floor((decimalSeconds * 60).toFixed(2)); // Converts number into a String and keeps only the specified number of decimals
        let label_1 = minutesValue + " minutes  " + secondsValue + " seconds";
        let label_2 = "MINUTES";
        textAlign(CENTER);
        if (this.overRect(this.timelineStart, 0, this.timelineLength, this.timelineHeight)) text(label_1, this.timelineStart + this.timelineLength / 2, this.timelineHeight);
        else text(label_2, this.timelineStart + this.timelineLength / 2, this.timelineHeight);
        textAlign(LEFT); // reset

    }

    drawFloorPlanSelector() {
        noFill();
        strokeWeight(3);
        stroke(0);
        circle(mouseX, mouseY, this.floorPlanCursorSelectSize);
    }

    drawSlicer() {
        fill(0);
        stroke(0);
        strokeWeight(2);
        line(mouseX, 0, mouseX, this.timelineHeight);
    }

    drawIntroMsg() {
        rectMode(CENTER);
        stroke(0);
        strokeWeight(1);
        fill(255, 240);
        rect(width / 2, height / 2.5, width / 1.75 + 50, height / 1.75 + 50);
        fill(0);
        textFont(font_Lato, this.keyTextSize);
        text(this.introMsg, width / 2, height / 2.5, width / 1.75, height / 1.75);
        rectMode(CORNER);
    }

    overCircle(x, y, diameter) {
        return sqrt(sq(x - mouseX) + sq(y - mouseY)) < diameter / 2;
    }

    overRect(x, y, boxWidth, boxHeight) {
        return mouseX >= x && mouseX <= x + boxWidth && mouseY >= y && mouseY <= y + boxHeight;
    }

    /**
     * Toggles on and off global showMovement var to determine if movement or conversation keys show
     * NOTE: textSize is way to control dynamic scaling for gui methods and interface
     */
    overMovementConversationButtons() {
        textSize(keys.keyTextSize);
        let currXPos = keys.timelineStart;
        if (this.overRect(currXPos, keys.speakerKeysHeight, keys.buttonWidth + textWidth("Movement"), keys.buttonWidth)) core.isModeMovement = true;
        else if (this.overRect(currXPos + textWidth("Movement | "), keys.speakerKeysHeight, keys.buttonWidth + textWidth("Conversation"), keys.buttonWidth)) core.isModeMovement = false;
    }

    /**
     * Iterate over global core.speakerList and test if mouse is over any of speaker keys and update speaker accordingly
     * NOTE: textSize is way to control dynamic scaling for gui methods and interface
     */
    overSpeakerKeys() {
        textSize(keys.keyTextSize);
        let currXPos = keys.timelineStart + textWidth("Movement | Conversation") + keys.buttonWidth;
        for (const speaker of core.speakerList) {
            let nameWidth = textWidth(speaker.name); // set nameWidth to pixel width of speaker code
            if (this.overRect(currXPos, keys.speakerKeysHeight, keys.buttonWidth + nameWidth, keys.buttonWidth)) speaker.show = !speaker.show;
            currXPos += keys.buttonWidth + nameWidth + keys.buttonSpacing;
        }
    }

    /**
     * Iterate over global core.paths list and test if mouse is over any of core.paths and update accordingly
     * NOTE: textSize is way to control dynamic scaling for gui methods and interface
     */
    overPathKeys() {
        textSize(keys.keyTextSize);
        let currXPos = keys.timelineStart + textWidth("Movement | Conversation") + keys.buttonWidth;
        for (const path of core.paths) {
            const nameWidth = textWidth(path.name); // set nameWidth to pixel width of path name
            if (this.overRect(currXPos, keys.speakerKeysHeight, keys.buttonWidth + nameWidth, keys.buttonWidth)) path.show = !path.show;
            currXPos += keys.buttonWidth + nameWidth + keys.buttonSpacing;
        }
    }

    /**
     * Iterate over each interaction button and toggle boolean or call corresponding gui method for button
     * NOTE: textSize is way to control dynamic scaling for gui methods and interface
     */
    overInteractionButtons() {
        textSize(keys.keyTextSize);
        let currXPos = keys.timelineStart + keys.buttonSpacing / 2;
        if (this.overRect(currXPos, keys.buttonsHeight, textWidth(this.BUTTON_NAMES[0]), keys.buttonWidth)) this.overAnimateButton();
        else if (this.overRect(currXPos + textWidth(this.BUTTON_NAMES[0]) + 2 * keys.buttonSpacing, keys.buttonsHeight, textWidth(this.BUTTON_NAMES[1]) + keys.buttonSpacing, keys.buttonWidth)) core.isModeAlignTalkTop = !core.isModeAlignTalkTop;
        else if (this.overRect(currXPos + textWidth(this.BUTTON_NAMES[0] + this.BUTTON_NAMES[1]) + 4 * keys.buttonSpacing, keys.buttonsHeight, textWidth(this.BUTTON_NAMES[2]) + keys.buttonSpacing, keys.buttonWidth)) core.isModeAllTalkOnPath = !core.isModeAllTalkOnPath;
        else if (testData.dataIsLoaded(videoPlayer) && this.overRect(currXPos + textWidth(this.BUTTON_NAMES[0] + this.BUTTON_NAMES[1] + this.BUTTON_NAMES[2]) + 6 * keys.buttonSpacing, keys.buttonsHeight, textWidth(this.BUTTON_NAMES[3]) + keys.buttonSpacing, keys.buttonWidth)) this.overVideoButton();
        else if (this.overRect(currXPos + textWidth(this.BUTTON_NAMES[0] + this.BUTTON_NAMES[1] + this.BUTTON_NAMES[2] + this.BUTTON_NAMES[3]) + 8 * keys.buttonSpacing, keys.buttonsHeight, textWidth(this.BUTTON_NAMES[4]) + keys.buttonSpacing, keys.buttonWidth)) core.isModeIntro = !core.isModeIntro;
    }

    /**
     * Toggle on and off core.isModeAnimate mode and set/end global core.isModeAnimate counter variable
     */
    overAnimateButton() {
        if (core.isModeAnimate) {
            core.isModeAnimate = false;
            core.animationCounter = map(keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd, 0, core.totalTimeInSeconds); // set to keys.curPixelTimeMax mapped value
        } else {
            core.isModeAnimate = true;
            core.animationCounter = map(keys.curPixelTimeMin, keys.timelineStart, keys.timelineEnd, 0, core.totalTimeInSeconds); // set to keys.curPixelTimeMin mapped value
        }
    }

    /**
     * Updates keys.curPixelTimeMin or keys.curPixelTimeMax global variables depending on left or right selector that user is over
     * NOTE: Is triggered if user already dragging or begins dragging
     */
    handleTimeline() {
        const xPosLeftSelector = keys.curPixelTimeMin;
        const xPosRightSelector = keys.curPixelTimeMax;
        if (this.lockedLeft || (!this.lockedRight && this.overRect(xPosLeftSelector - this.selPadding, keys.yPosTimelineTop, 2 * this.selPadding, keys.timelineThickness))) {
            this.lockedLeft = true;
            keys.curPixelTimeMin = constrain(mouseX, keys.timelineStart, keys.timelineEnd);
            if (keys.curPixelTimeMin > keys.curPixelTimeMax - (2 * this.selPadding)) keys.curPixelTimeMin = keys.curPixelTimeMax - (2 * this.selPadding); // prevents overstriking
        } else if (this.lockedRight || this.overRect(xPosRightSelector - this.selPadding, keys.yPosTimelineTop, 2 * this.selPadding, keys.timelineThickness)) {
            this.lockedRight = true;
            keys.curPixelTimeMax = constrain(mouseX, keys.timelineStart, keys.timelineEnd);
            if (keys.curPixelTimeMax < keys.curPixelTimeMin + (2 * this.selPadding)) keys.curPixelTimeMax = keys.curPixelTimeMin + (2 * this.selPadding); // prevents overstriking
        }
    }

    /**
     * Toggle whether video is playing and whether video is showing
     * NOTE: this is different than playPauseMovie method
     */
    overVideoButton() {
        if (core.isModeVideoShowing) {
            videoPlayer.pause();
            videoPlayer.hide();
            core.isModeVideoPlaying = false; // important to set this
        } else {
            videoPlayer.show();
        }
        core.isModeVideoShowing = !core.isModeVideoShowing; // set after testing
    }

    /**
     * Plays/pauses movie and updates videoPlayhead if setting to play
     * Also toggles global core.isModeVideoPlaying variable
     */
    playPauseMovie() {
        if (core.isModeVideoPlaying) {
            videoPlayer.pause();
            core.isModeVideoPlaying = false;
        } else {
            // first map mouse to selected time values in GUI
            const mapMousePos = map(mouseX, keys.timelineStart, keys.timelineEnd, keys.curPixelTimeMin, keys.curPixelTimeMax);
            // must floor vPos to prevent double finite error
            const videoPos = Math.floor(map(mapMousePos, keys.timelineStart, keys.timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())));
            videoPlayer.play();
            videoPlayer.seekTo(videoPos);
            core.isModeVideoPlaying = true;
        }
    }
}