class Keys {

    drawKeys() {
        textFont(font_PlayfairReg, keyTextSize);
        this.drawSpeakerKeys();
        textFont(font_PlayfairReg, keyTextSize);
        this.drawbuttons();
        this.drawTitles();
        textFont(font_PlayfairReg, infoTextSize);
        this.drawTimeline();
        if (selectRegion && mouseX < timelineStart && mouseY < timelineHeight) this.drawRegion();
    }

    drawSpeakerKeys() {
        // var currXPos = timelineStart;
        // strokeWeight(5);
        // var rectWidth = buttonWidth;
        // for (var i = 0; i < speakerCodes.length; i++) {
        //     var code = speakerCodes[i][0];
        //     stroke(speakerCodes[i][2]);
        //     noFill();
        //     rect(currXPos, speakerKeysHeight, rectWidth, rectWidth);
        //     if (speakerCodes[i][1]) {
        //         fill(speakerCodes[i][2]);
        //         rect(currXPos, speakerKeysHeight, rectWidth, rectWidth);
        //     }
        //     fill(0);
        //     noStroke();
        //     text(code, currXPos + 1.3 * buttonWidth, speakerKeysHeight - buttonWidth / 5);
        //     currXPos += (buttonWidth + textWidth(code) + buttonSpacing);
        // }
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
        fill(conversationView_1 ? 0 : 150);
        text(button_2, currXPos, buttonsHeight);
        noFill();
        stroke(conversationView_1 ? 0 : 150);
        strokeWeight(1);
        rect(currXPos - buttonSpacing / 2, buttonsHeight, textWidth(button_2) + buttonSpacing, buttonSpacing * 1.5);
        noStroke();
        currXPos += textWidth(button_2) + buttonSpacing * 2;
        // Button 3
        fill(conversationView_2 ? 0 : 150);
        text(button_3, currXPos, buttonsHeight);
        noFill();
        stroke(conversationView_2 ? 0 : 150);
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
        text(titleMsg, buttonWidth, speakerKeysHeight - buttonWidth);
        textFont(font_PlayfairItalic, infoTextSize);
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
        var startValue = floor(map(currPixelTimeMin, timelineStart, timelineEnd, 0, videoDuration));
        var endValue = ceil(map(currPixelTimeMax, timelineStart, timelineEnd, 0, videoDuration));
        text(floor(startValue / 60), timelineStart + tickHeight / 2, timelineHeight);
        text(ceil(endValue / 60), timelineEnd - tickHeight, timelineHeight);
        // Text for timeline label
        var mapMouseX = map(mouseX, timelineStart, timelineEnd, currPixelTimeMin, currPixelTimeMax);
        var videoTimeInSeconds = map(mapMouseX, timelineStart, timelineEnd, 0, videoDuration); // remap to get seconds in video from remapped mouse position   
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
