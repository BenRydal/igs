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
    }

    drawKeys() {
        textFont(font_PlayfairReg, this.keyTextSize);
        this.drawPathSpeakerTitle();
        if (isModeMovement) this.drawPathSpeakerKeys(paths);
        else this.drawPathSpeakerKeys(speakerList);
        this.drawTimeline();
        this.drawButtons();
        if (overRect(0, 0, this.displayFloorPlanWidth, this.displayFloorPlanHeight)) this.drawFloorPlanSelector();
        if (isIntroMsg) this.drawIntroMsg(); // draw intro message on program start up until mouse is pressed
    }

    drawPathSpeakerTitle() {
        let currXPos = this.timelineStart;
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
        let currXPos = this.timelineStart + textWidth("Movement | Conversation") + this.buttonWidth;
        let yPos = this.speakerKeysHeight - this.buttonWidth / 5;
        strokeWeight(5);
        for (let i = 0; i < list.length; i++) {
            let curObject = list[i];
            stroke(curObject.color);
            noFill();
            rect(currXPos, this.speakerKeysHeight, this.buttonWidth, this.buttonWidth);
            if (curObject.show) {
                fill(curObject.color);
                rect(currXPos, this.speakerKeysHeight, this.buttonWidth, this.buttonWidth);
            }
            fill(0);
            noStroke();
            text(curObject.name, currXPos + 1.3 * this.buttonWidth, yPos);
            currXPos += this.buttonWidth + textWidth(curObject.name) + this.buttonSpacing;
        }
    }

    drawButtons() {
        let currXPos = this.timelineStart + this.buttonSpacing / 2;
        fill(isAnimate ? 0 : 150);
        // Button 1
        text(buttons[0], currXPos, this.buttonsHeight);
        noFill();
        stroke(isAnimate ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - this.buttonSpacing / 2, this.buttonsHeight, textWidth(buttons[0]) + this.buttonSpacing, this.buttonSpacing * 1.5);
        noStroke();
        currXPos += textWidth(buttons[0]) + this.buttonSpacing * 2;
        // Button 2
        fill(isModeAlignTalkTop ? 0 : 150);
        text(buttons[1], currXPos, this.buttonsHeight);
        noFill();
        stroke(isModeAlignTalkTop ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - this.buttonSpacing / 2, this.buttonsHeight, textWidth(buttons[1]) + this.buttonSpacing, this.buttonSpacing * 1.5);
        noStroke();
        currXPos += textWidth(buttons[1]) + this.buttonSpacing * 2;
        // Button 3
        fill(isModeAllTalkOnPath ? 0 : 150);
        text(buttons[2], currXPos, this.buttonsHeight);
        noFill();
        stroke(isModeAllTalkOnPath ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - this.buttonSpacing / 2, this.buttonsHeight, textWidth(buttons[2]) + this.buttonSpacing, this.buttonSpacing * 1.5);
        noStroke();
        currXPos += textWidth(buttons[2]) + this.buttonSpacing * 2;
        // Button 4
        fill(videoIsShowing ? 0 : 150);
        text(buttons[3], currXPos, this.buttonsHeight);
        noFill();
        stroke(videoIsShowing ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - this.buttonSpacing / 2, this.buttonsHeight, textWidth(buttons[3]) + this.buttonSpacing, this.buttonSpacing * 1.5);
        noStroke();
        currXPos += textWidth(buttons[3]) + this.buttonSpacing * 2;
        // Button 5
        textFont(font_PlayfairItalic, this.keyTextSize);
        fill(isIntroMsg ? 0 : 150);
        text(buttons[4], currXPos, this.buttonsHeight);
        noFill();
        stroke(isIntroMsg ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - this.buttonSpacing / 2, this.buttonsHeight, textWidth(buttons[4]) + this.buttonSpacing, this.buttonSpacing * 1.5);
        noStroke();
    }

    drawTimeline() {
        // timeline selection rectangle
        fill(150, 150);
        noStroke();
        if (isAnimate) rect(this.curPixelTimeMin, this.timelineHeight - this.tickHeight, map(animationCounter, 0, totalTimeInSeconds, this.timelineStart, this.timelineEnd) - this.curPixelTimeMin, 2 * (this.tickHeight));
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
        let startValue = floor(map(this.curPixelTimeMin, this.timelineStart, this.timelineEnd, 0, totalTimeInSeconds));
        let endValue = ceil(map(this.curPixelTimeMax, this.timelineStart, this.timelineEnd, 0, totalTimeInSeconds));
        text(floor(startValue / 60), this.timelineStart + this.tickHeight / 2, this.timelineHeight);
        text(ceil(endValue / 60), this.timelineEnd - this.tickHeight, this.timelineHeight);
        // Text for timeline label
        let mapMouseX = map(mouseX, this.timelineStart, this.timelineEnd, this.curPixelTimeMin, this.curPixelTimeMax);
        let videoTimeInSeconds = map(mapMouseX, this.timelineStart, this.timelineEnd, 0, totalTimeInSeconds); // remap to get seconds in video from remapped mouse position   
        let videoTimeInMinutes = videoTimeInSeconds / 60; // float value of minutes and seconds
        let minutesValue = floor(videoTimeInMinutes); // floor to get minutes
        let decimalSeconds = videoTimeInMinutes - minutesValue; //  Subtract minutes to get decimal seconds---e.g., 14.28571429 - 14... returns (.28571429)
        let secondsValue = floor((decimalSeconds * 60).toFixed(2)); // Converts number into a String and keeps only the specified number of decimals
        let label_1 = minutesValue + " minutes  " + secondsValue + " seconds";
        let label_2 = "MINUTES";
        textAlign(CENTER);
        if (overRect(this.timelineStart, 0, this.timelineLength, this.timelineHeight)) text(label_1, this.timelineStart + this.timelineLength / 2, this.timelineHeight);
        else text(label_2, this.timelineStart + this.timelineLength / 2, this.timelineHeight);
        textAlign(LEFT); // reset

    }

    drawFloorPlanSelector() {
        noFill();
        strokeWeight(3);
        stroke(0);
        circle(mouseX, mouseY, this.floorPlanCursorSelectSize);
    }

    drawIntroMsg() {
        rectMode(CENTER);
        stroke(0);
        strokeWeight(1);
        fill(255, 240);
        rect(width / 2, height / 2.5, width / 1.75 + 50, height / 1.75 + 50);
        fill(0);
        textFont(font_Lato, this.keyTextSize);
        text(introMSG, width / 2, height / 2.5, width / 1.75, height / 1.75);
        rectMode(CORNER);
    }
}