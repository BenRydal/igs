class Keys {

    drawKeys() {
        textFont(font_PlayfairReg, keyTextSize);
        this.drawPathSpeakerTitle();
        if (movementKeyTitle) this.drawPathSpeakerKeys(paths);
        else this.drawPathSpeakerKeys(speakerList);
        this.drawTimeline();
        this.drawbuttons();
        if (overRect(0, 0, displayFloorPlanWidth, displayFloorPlanHeight)) this.drawFloorPlanSelector();
        if (showIntroMsg) this.drawIntroMsg(); // draw intro message on program start up until mouse is pressed
    }

    drawPathSpeakerTitle() {
        let currXPos = timelineStart;
        let yPos = speakerKeysHeight - buttonWidth / 5;
        noStroke();
        fill(movementKeyTitle ? 0 : 150);
        text("Movement", currXPos, yPos);
        fill(0);
        text(" | ", currXPos + textWidth("Movement"), yPos);
        fill(!movementKeyTitle ? 0 : 150);
        text("Conversation", currXPos + textWidth("Movement | "), yPos);
    }

    // Loop through speakers and set fill/stroke in keys for all if showing/not showing
    drawPathSpeakerKeys(list) {
        let currXPos = timelineStart + textWidth("Movement | Conversation") + buttonWidth;
        let yPos = speakerKeysHeight - buttonWidth / 5;
        strokeWeight(5);
        for (let i = 0; i < list.length; i++) {
            let curObject = list[i];
            stroke(curObject.color);
            noFill();
            rect(currXPos, speakerKeysHeight, buttonWidth, buttonWidth);
            if (curObject.show) {
                fill(curObject.color);
                rect(currXPos, speakerKeysHeight, buttonWidth, buttonWidth);
            }
            fill(0);
            noStroke();
            text(curObject.name, currXPos + 1.3 * buttonWidth, yPos);
            currXPos += buttonWidth + textWidth(curObject.name) + buttonSpacing;
        }
    }

    drawbuttons() {
        let currXPos = timelineStart + buttonSpacing / 2;
        fill(animation ? 0 : 150);
        // Button 1
        text(buttons[0], currXPos, buttonsHeight);
        noFill();
        stroke(animation ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - buttonSpacing / 2, buttonsHeight, textWidth(buttons[0]) + buttonSpacing, buttonSpacing * 1.5);
        noStroke();
        currXPos += textWidth(buttons[0]) + buttonSpacing * 2;
        // Button 2
        fill(conversationPositionTop ? 0 : 150);
        text(buttons[1], currXPos, buttonsHeight);
        noFill();
        stroke(conversationPositionTop ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - buttonSpacing / 2, buttonsHeight, textWidth(buttons[1]) + buttonSpacing, buttonSpacing * 1.5);
        noStroke();
        currXPos += textWidth(buttons[1]) + buttonSpacing * 2;
        // Button 3
        fill(allConversation ? 0 : 150);
        text(buttons[2], currXPos, buttonsHeight);
        noFill();
        stroke(allConversation ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - buttonSpacing / 2, buttonsHeight, textWidth(buttons[2]) + buttonSpacing, buttonSpacing * 1.5);
        noStroke();
        currXPos += textWidth(buttons[2]) + buttonSpacing * 2;
        // Button 4
        fill(videoIsShowing ? 0 : 150);
        text(buttons[3], currXPos, buttonsHeight);
        noFill();
        stroke(videoIsShowing ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - buttonSpacing / 2, buttonsHeight, textWidth(buttons[3]) + buttonSpacing, buttonSpacing * 1.5);
        noStroke();
        currXPos += textWidth(buttons[3]) + buttonSpacing * 2;
        // Button 5
        textFont(font_PlayfairItalic, keyTextSize);
        fill(showIntroMsg ? 0 : 150);
        text(buttons[4], currXPos, buttonsHeight);
        noFill();
        stroke(showIntroMsg ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - buttonSpacing / 2, buttonsHeight, textWidth(buttons[4]) + buttonSpacing, buttonSpacing * 1.5);
        noStroke();
    }

    drawTimeline() {
        // timeline selection rectangle
        fill(150, 150);
        noStroke();
        if (animation) rect(currPixelTimeMin, timelineHeight - tickHeight, map(animationCounter, 0, totalTimeInSeconds, timelineStart, timelineEnd) - currPixelTimeMin, 2 * (tickHeight));
        else rect(currPixelTimeMin, timelineHeight - tickHeight, currPixelTimeMax - currPixelTimeMin, 2 * (tickHeight));
        // timeline
        stroke(0);
        strokeWeight(1);
        line(timelineStart, timelineHeight, timelineEnd, timelineHeight); // horizontal
        // Selector lines
        strokeWeight(4);
        line(currPixelTimeMin, timelineHeight - tickHeight, currPixelTimeMin, timelineHeight + tickHeight);
        line(currPixelTimeMax, timelineHeight - tickHeight, currPixelTimeMax, timelineHeight + tickHeight);

        // Text for minutes at start/end of timeline
        noStroke();
        fill(0);
        let startValue = floor(map(currPixelTimeMin, timelineStart, timelineEnd, 0, totalTimeInSeconds));
        let endValue = ceil(map(currPixelTimeMax, timelineStart, timelineEnd, 0, totalTimeInSeconds));
        text(floor(startValue / 60), timelineStart + tickHeight / 2, timelineHeight);
        text(ceil(endValue / 60), timelineEnd - tickHeight, timelineHeight);
        // Text for timeline label
        let mapMouseX = map(mouseX, timelineStart, timelineEnd, currPixelTimeMin, currPixelTimeMax);
        let videoTimeInSeconds = map(mapMouseX, timelineStart, timelineEnd, 0, totalTimeInSeconds); // remap to get seconds in video from remapped mouse position   
        let videoTimeInMinutes = videoTimeInSeconds / 60; // float value of minutes and seconds
        let minutesValue = floor(videoTimeInMinutes); // floor to get minutes
        let decimalSeconds = videoTimeInMinutes - minutesValue; //  Subtract minutes to get decimal seconds---e.g., 14.28571429 - 14... returns (.28571429)
        let secondsValue = floor(decimalSeconds.toFixed(2) * 60); // Converts number into a String and keeps only the specified number of decimals
        let label_1 = minutesValue + " minutes  " + secondsValue + " seconds";
        let label_2 = "MINUTES";
        textAlign(CENTER);
        if (overRect(timelineStart, 0, timelineLength, timelineHeight)) text(label_1, timelineStart + timelineLength / 2, timelineHeight);
        else text(label_2, timelineStart + timelineLength / 2, timelineHeight);
        textAlign(LEFT); // reset

    }

    drawFloorPlanSelector() {
        noFill();
        strokeWeight(3);
        stroke(0);
        circle(mouseX, mouseY, floorPlanSelectorSize);
    }

    drawIntroMsg() {
        rectMode(CENTER);
        stroke(0);
        strokeWeight(1);
        fill(255, 240);
        rect(width / 2, height / 2.5, width / 1.75 + spacing, height / 1.75 + spacing);
        fill(0);
        textFont(font_Lato, keyTextSize);
        text(introMSG, width / 2, height / 2.5, width / 1.75, height / 1.75);
        rectMode(CORNER);
    }
}