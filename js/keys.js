class Keys {

    constructor() {
        this.timeline = {
            start: width * 0.4638,
            end: width * 0.9638,
            selectStart: width * 0.4638,
            selectEnd: width * 0.9638,
            tickHeight: 25,
            padding: 20,
            length: width * 0.9638 - width * 0.4638,
            height: height * .81,
            top: height * .81 - 25,
            bottom: height * .81 + 25,
            thickness: 25 * 2,
        }

        // this.floorPlan = {
        //     width: this.timeline.start - (width - this.timeline.end),
        //     height: this.timeline.height
        // }
        this.displayFloorPlanWidth = this.timeline.start - (width - this.timeline.end);
        this.displayFloorPlanHeight = this.timeline.height;

        this.keyTextSize = width / 70;
        this.floorPlanCursorSelectSize = 100;
        this.introMsg = "INTERACTION GEOGRAPHY SLICER (IGS)\n\nby Ben Rydal Shapiro & contributors\nbuilt with p5.js & JavaScript\n\nHi There! This is a tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan view (left) and a space-time view (right), where the vertical axis corresponds to the vertical dimension of the floor plan. Use the top menu to visualize different sample datasets or upload your own data. Hover over the floor plan and use the timeline to selectively study displayed data. Use the bottom buttons to animate data, visualize conversation in different ways, and interact with video data by clicking the timeline to play & pause video. For more information see: benrydal.com/software/igs";
        this.lockedLeft = false;
        this.lockedRight = false;
        this.buttonSpacing = width / 71;
        this.buttonWidth = this.buttonSpacing;
        this.speakerKeysHeight = this.timeline.height + (height - this.timeline.height) / 4;
    }

    drawKeys() {
        textAlign(LEFT, TOP);
        textFont(font_Lato, this.keyTextSize);
        this.drawPathSpeakerTitle();
        if (isModeMovement) this.drawPathSpeakerKeys(core.paths);
        else this.drawPathSpeakerKeys(core.speakerList);
        this.drawTimeline();
        if (this.overRect(0, 0, this.displayFloorPlanWidth, this.displayFloorPlanHeight)) this.drawFloorPlanSelector();
        if (this.overRect(this.timeline.start, 0, this.timeline.length, this.timeline.height)) this.drawSlicer(); // draw slicer line after calculating all movement
        if (isModeIntro) this.drawIntroMsg(); // draw intro message on program start up until mouse is pressed
    }

    drawPathSpeakerTitle() {
        let currXPos = this.timeline.start;
        let yPos = this.speakerKeysHeight - this.buttonWidth / 5;
        noStroke();
        fill(isModeMovement ? 0 : 150);
        text("Movement", currXPos, yPos);
        fill(0);
        text(" | ", currXPos + textWidth("Movement"), yPos);
        fill(!isModeMovement ? 0 : 150);
        text("Conversation", currXPos + textWidth("Movement | "), yPos);
    }

    // Loop through speakers and set fill/stroke in keys for all if showing/not showing
    drawPathSpeakerKeys(list) {
        let currXPos = this.timeline.start + textWidth("Movement | Conversation") + this.buttonWidth;
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


    drawTimeline() {
        // timeline selection rectangle
        fill(150, 150);
        noStroke();
        if (isModeAnimate) rect(this.timeline.selectStart, this.timeline.height - this.timeline.tickHeight, map(animationCounter, 0, core.totalTimeInSeconds, this.timeline.start, this.timeline.end) - this.timeline.selectStart, 2 * (this.timeline.tickHeight));
        else rect(this.timeline.selectStart, this.timeline.height - this.timeline.tickHeight, this.timeline.selectEnd - this.timeline.selectStart, 2 * (this.timeline.tickHeight));
        // timeline
        stroke(0);
        strokeWeight(1);
        line(this.timeline.start, this.timeline.height, this.timeline.end, this.timeline.height); // horizontal
        // Selector lines
        strokeWeight(4);
        line(this.timeline.selectStart, this.timeline.height - this.timeline.tickHeight, this.timeline.selectStart, this.timeline.height + this.timeline.tickHeight);
        line(this.timeline.selectEnd, this.timeline.height - this.timeline.tickHeight, this.timeline.selectEnd, this.timeline.height + this.timeline.tickHeight);

        // Text for minutes at start/end of timeline
        noStroke();
        fill(0);
        let startValue = floor(map(this.timeline.selectStart, this.timeline.start, this.timeline.end, 0, core.totalTimeInSeconds));
        let endValue = ceil(map(this.timeline.selectEnd, this.timeline.start, this.timeline.end, 0, core.totalTimeInSeconds));
        text(floor(startValue / 60), this.timeline.start + this.timeline.tickHeight / 2, this.timeline.height);
        text(ceil(endValue / 60), this.timeline.end - this.timeline.tickHeight, this.timeline.height);
        // Text for timeline label
        let mapMouseX = map(mouseX, this.timeline.start, this.timeline.end, this.timeline.selectStart, this.timeline.selectEnd);
        let videoTimeInSeconds = map(mapMouseX, this.timeline.start, this.timeline.end, 0, core.totalTimeInSeconds); // remap to get seconds in video from remapped mouse position   
        let videoTimeInMinutes = videoTimeInSeconds / 60; // float value of minutes and seconds
        let minutesValue = floor(videoTimeInMinutes); // floor to get minutes
        let decimalSeconds = videoTimeInMinutes - minutesValue; //  Subtract minutes to get decimal seconds---e.g., 14.28571429 - 14... returns (.28571429)
        let secondsValue = floor((decimalSeconds * 60).toFixed(2)); // Converts number into a String and keeps only the specified number of decimals
        let label_1 = minutesValue + " minutes  " + secondsValue + " seconds";
        let label_2 = "MINUTES";
        textAlign(CENTER);
        if (this.overRect(this.timeline.start, 0, this.timeline.length, this.timeline.height)) text(label_1, this.timeline.start + this.timeline.length / 2, this.timeline.height);
        else text(label_2, this.timeline.start + this.timeline.length / 2, this.timeline.height);
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
        line(mouseX, 0, mouseX, this.timeline.height);
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
        let currXPos = keys.timeline.start;
        if (this.overRect(currXPos, keys.speakerKeysHeight, keys.buttonWidth + textWidth("Movement"), keys.buttonWidth)) isModeMovement = true;
        else if (this.overRect(currXPos + textWidth("Movement | "), keys.speakerKeysHeight, keys.buttonWidth + textWidth("Conversation"), keys.buttonWidth)) isModeMovement = false;
    }

    /**
     * Iterate over global core.speakerList and test if mouse is over any of speaker keys and update speaker accordingly
     * NOTE: textSize is way to control dynamic scaling for gui methods and interface
     */
    overSpeakerKeys() {
        textSize(keys.keyTextSize);
        let currXPos = keys.timeline.start + textWidth("Movement | Conversation") + keys.buttonWidth;
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
        let currXPos = keys.timeline.start + textWidth("Movement | Conversation") + keys.buttonWidth;
        for (const path of core.paths) {
            const nameWidth = textWidth(path.name); // set nameWidth to pixel width of path name
            if (this.overRect(currXPos, keys.speakerKeysHeight, keys.buttonWidth + nameWidth, keys.buttonWidth)) path.show = !path.show;
            currXPos += keys.buttonWidth + nameWidth + keys.buttonSpacing;
        }
    }

    /**
     * Toggle on and off isModeAnimate mode and set/end global isModeAnimate counter variable
     */
    overAnimateButton() {
        if (isModeAnimate) {
            isModeAnimate = false;
            animationCounter = map(keys.timeline.selectEnd, keys.timeline.start, keys.timeline.end, 0, core.totalTimeInSeconds); // set to keys.timeline.selectEnd mapped value
        } else {
            isModeAnimate = true;
            animationCounter = map(keys.timeline.selectStart, keys.timeline.start, keys.timeline.end, 0, core.totalTimeInSeconds); // set to keys.timeline.selectStart mapped value
        }
    }

    /**
     * Updates keys.timeline.selectStart or keys.timeline.selectEnd global variables depending on left or right selector that user is over
     * NOTE: Is triggered if user already dragging or begins dragging
     */
    handleTimeline() {
        const xPosLeftSelector = keys.timeline.selectStart;
        const xPosRightSelector = keys.timeline.selectEnd;
        if (this.lockedLeft || (!this.lockedRight && this.overRect(xPosLeftSelector - this.timeline.padding, keys.timeline.top, 2 * this.timeline.padding, keys.timeline.thickness))) {
            this.lockedLeft = true;
            keys.timeline.selectStart = constrain(mouseX, keys.timeline.start, keys.timeline.end);
            if (keys.timeline.selectStart > keys.timeline.selectEnd - (2 * this.timeline.padding)) keys.timeline.selectStart = keys.timeline.selectEnd - (2 * this.timeline.padding); // prevents overstriking
        } else if (this.lockedRight || this.overRect(xPosRightSelector - this.timeline.padding, keys.timeline.top, 2 * this.timeline.padding, keys.timeline.thickness)) {
            this.lockedRight = true;
            keys.timeline.selectEnd = constrain(mouseX, keys.timeline.start, keys.timeline.end);
            if (keys.timeline.selectEnd < keys.timeline.selectStart + (2 * this.timeline.padding)) keys.timeline.selectEnd = keys.timeline.selectStart + (2 * this.timeline.padding); // prevents overstriking
        }
    }

    /**
     * Toggle whether video is playing and whether video is showing
     * NOTE: this is different than playPauseMovie method
     */
    overVideoButton() {
        if (isModeVideoShowing) {
            core.videoPlayer.pause();
            core.videoPlayer.hide();
            isModeVideoPlaying = false; // important to set this
        } else {
            core.videoPlayer.show();
        }
        isModeVideoShowing = !isModeVideoShowing; // set after testing
    }

    /**
     * Plays/pauses movie and updates videoPlayhead if setting to play
     * Also toggles global isModeVideoPlaying variable
     */
    playPauseMovie() {
        if (isModeVideoPlaying) {
            core.videoPlayer.pause();
            isModeVideoPlaying = false;
        } else {
            // first map mouse to selected time values in GUI
            const mapMousePos = map(mouseX, keys.timeline.start, keys.timeline.end, keys.timeline.selectStart, keys.timeline.selectEnd);
            // must floor vPos to prevent double finite error
            const videoPos = Math.floor(map(mapMousePos, keys.timeline.start, keys.timeline.end, 0, Math.floor(core.videoPlayer.getVideoDuration())));
            core.videoPlayer.play();
            core.videoPlayer.seekTo(videoPos);
            isModeVideoPlaying = true;
        }
    }
}