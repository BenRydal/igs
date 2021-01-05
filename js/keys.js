class Keys {

    drawKeys() {
        textFont(font_PlayfairReg, keyTextSize);
        this.drawPathSpeakerTitle();
        if (movementKeyTitle) this.drawPathSpeakerKeys(paths);
        else this.drawPathSpeakerKeys(speakerList);
        this.drawbuttons();
        this.drawTitles();
        textFont(font_PlayfairReg, infoTextSize);
        this.drawTimeline();
        if (selectRegion && mouseX < timelineStart && mouseY < timelineHeight) this.drawRegion();
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
        var currXPos = timelineStart + buttonSpacing / 2;
        fill(animation ? 0 : 150);
        // Button 1
        text(button_1, currXPos, buttonsHeight);
        noFill();
        stroke(animation ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - buttonSpacing / 2, buttonsHeight, textWidth(button_1) + buttonSpacing, buttonSpacing * 1.5);
        noStroke();
        currXPos += textWidth(button_1) + buttonSpacing * 2;
        // Button 2
        fill(conversationPositionTop ? 0 : 150);
        text(button_2, currXPos, buttonsHeight);
        noFill();
        stroke(conversationPositionTop ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - buttonSpacing / 2, buttonsHeight, textWidth(button_2) + buttonSpacing, buttonSpacing * 1.5);
        noStroke();
        currXPos += textWidth(button_2) + buttonSpacing * 2;
        // Button 3
        fill(allConversation ? 0 : 150);
        text(button_3, currXPos, buttonsHeight);
        noFill();
        stroke(allConversation ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - buttonSpacing / 2, buttonsHeight, textWidth(button_3) + buttonSpacing, buttonSpacing * 1.5);
        noStroke();
        currXPos += textWidth(button_3) + buttonSpacing * 2;
        // Button 4
        fill(videoMode ? 0 : 150);
        text(button_4, currXPos, buttonsHeight);
        noFill();
        stroke(videoMode ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - buttonSpacing / 2, buttonsHeight, textWidth(button_4) + buttonSpacing, buttonSpacing * 1.5);
        noStroke();
        currXPos += textWidth(button_4) + buttonSpacing * 2;
        // Button 5
        textFont(font_PlayfairItalic);
        fill(howToRead ? 0 : 150);
        text(button_5, currXPos, buttonsHeight);
        noFill();
        stroke(howToRead ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - buttonSpacing / 2, buttonsHeight, textWidth(button_5) + buttonSpacing, buttonSpacing * 1.5);
        noStroke();
    }

    drawTitles() {
        fill(0);
        textFont(font_Playfairbold, titleTextSize);
        // text(titleMsg, buttonWidth, speakerKeysHeight - buttonWidth);
        textFont(font_PlayfairReg, infoTextSize);
        text(infoMsg, buttonWidth, buttonsHeight - buttonWidth, timelineStart - 6 * buttonSpacing, height);
    }

    drawTimeline() {
        // timeline selection rectangle
        fill(150, 150);
        noStroke();
        if (animation) rect(currPixelTimeMin, timelineHeight - tickHeight, map(animationCounter, 0, animationMaxValue, timelineStart, timelineEnd) - currPixelTimeMin, 2 * (tickHeight));
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
        var startValue = floor(map(currPixelTimeMin, timelineStart, timelineEnd, 0, totalTimeInSeconds));
        var endValue = ceil(map(currPixelTimeMax, timelineStart, timelineEnd, 0, totalTimeInSeconds));
        text(floor(startValue / 60), timelineStart + tickHeight / 2, timelineHeight);
        text(ceil(endValue / 60), timelineEnd - tickHeight, timelineHeight);
        // Text for timeline label
        var mapMouseX = map(mouseX, timelineStart, timelineEnd, currPixelTimeMin, currPixelTimeMax);
        var videoTimeInSeconds = map(mapMouseX, timelineStart, timelineEnd, 0, totalTimeInSeconds); // remap to get seconds in video from remapped mouse position   
        var videoTimeInMinutes = videoTimeInSeconds / 60; // float value of minutes and seconds
        var minutesValue = floor(videoTimeInMinutes); // floor to get minutes
        var decimalSeconds = videoTimeInMinutes - minutesValue; //  Subtract minutes to get decimal seconds---e.g., 14.28571429 - 14... returns (.28571429)
        var secondsValue = floor(decimalSeconds.toFixed(2) * 60); // Converts number into a String and keeps only the specified number of decimals
        var label_1 = minutesValue + " Minutes  " + secondsValue + " Seconds";
        var label_2 = "MINUTES & SECONDS";
        textAlign(CENTER);
        if (overRect(timelineStart, 0, timelineLength, timelineHeight)) text(label_1, timelineStart + timelineLength / 2, timelineHeight);
        else text(label_2, timelineStart + timelineLength / 2, timelineHeight);
        textAlign(LEFT); // reset

    }

    drawRegion() {
        noFill();
        strokeWeight(3);
        stroke(0);
        circle(mouseX, mouseY, selectRegionCircleSize, selectRegionCircleSize);
    }
}