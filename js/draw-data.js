// Super class with 2 sub-classes drawDataMovement and drawDataConversation
class DrawData {

    constructor() {
        this.drawConversation = new DrawDataConversation();
        this.drawMovement = new DrawDataMovement();
    }

    setDrawData(path) {
        this.drawConversation.setData(path);
        this.drawMovement.setData(path);
    }

    setConversationBubble() {
        this.drawConversation.setConversationBubble();
    }

}

class DrawDataMovement {

    constructor() {
        this.bugXPos = -1;
        this.bugYPos = -1;
        this.bugTimePos = -1;
    }

    setData(path) {
        this.resetBug(); // always reset bug values
        // if overMap draw selection of movement and gray scale the rest
        if (overRect(0, 0, displayFloorPlanWidth, displayFloorPlanHeight)) {
            this.draw(PLAN, path.movement, colorGray);
            this.draw(SPACETIME, path.movement, colorGray);
            this.drawHighlight(PLAN, path.movement, path.color);
            this.drawHighlight(SPACETIME, path.movement, path.color);
        } else {
            this.draw(PLAN, path.movement, path.color);
            this.draw(SPACETIME, path.movement, path.color);
        }

        if (this.bugXPos != -1) this.drawBug(path.color); // if selected, draw bug
        if (!animation) this.drawSlicer();
    }

    // Main draw method to draw movement paths, also sets bug values
    draw(view, points, shade) {
        strokeWeight(pathWeight);
        stroke(shade);
        noFill(); // important for curve drawing
        beginShape();
        for (let i = 0; i < points.length; i++) {
            let point = points[i];
            let pixelTime = map(point.time, 0, totalTimeInSeconds, timelineStart, timelineEnd);
            if (this.overTimeline(pixelTime) && this.testAnimation(pixelTime)) {
                let scaledTime = map(pixelTime, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
                let scaledXPos = point.xPos * displayFloorPlanWidth / inputFloorPlanPixelWidth; // scale to floor plan image file
                let scaledYPos = point.yPos * displayFloorPlanHeight / inputFloorPlanPixelHeight; // scale to floor plan image file
                if (view == PLAN) curveVertex(scaledXPos, scaledYPos);
                else if (view == SPACETIME) {
                    curveVertex(scaledTime, scaledYPos);
                    if (this.testBugRecording(scaledTime)) this.recordBug(scaledXPos, scaledYPos, scaledTime);
                }
            }
        }
        endShape();
    }

    // Draws only shapes for points over mouse selection
    drawHighlight(view, points, shade) {
        strokeWeight(pathWeight * 2);
        stroke(shade);
        noFill(); // important for curve drawing
        let drawVertex = false; // set false to start
        for (let i = 0; i < points.length; i++) {
            let drawEndpoint = false; // boolean to draw additional endpoints for each shape to make sure all points included
            let point = points[i];
            let pixelTime = map(point.time, 0, totalTimeInSeconds, timelineStart, timelineEnd);
            let scaledXPos = point.xPos * displayFloorPlanWidth / inputFloorPlanPixelWidth; // scale to floor plan image file
            let scaledYPos = point.yPos * displayFloorPlanHeight / inputFloorPlanPixelHeight; // scale to floor plan image file
            // Tests if overTimeline and mouse selection and adjusts begin/end shape and boolean drawVertex to draw only that shape
            if (this.overTimeline(pixelTime) && this.overCursor(scaledXPos, scaledYPos) && this.testAnimation(pixelTime)) {
                if (!drawVertex) { // beginShape if no shape yet and set drawVertex to true
                    beginShape();
                    drawEndpoint = true;
                    drawVertex = true;
                }
            } else { // if not overtimeline and over mouse selection endShape and set drawVertex to false
                if (drawVertex) {
                    drawEndpoint = true;
                    endShape();
                    drawVertex = false;
                }
            }
            // Draw vertex if true in space and space-time
            if (drawVertex || drawEndpoint) {
                let scaledTime = map(pixelTime, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
                if (view == PLAN) curveVertex(scaledXPos, scaledYPos);
                else if (view == SPACETIME) curveVertex(scaledTime, scaledYPos);
                if (drawEndpoint) {
                    if (view == PLAN) curveVertex(scaledXPos, scaledYPos);
                    else if (view == SPACETIME) curveVertex(scaledTime, scaledYPos);
                }
            }
        }
        if (drawVertex) endShape(); // endShape if still true
    }

    overTimeline(timeValue) {
        return timeValue >= currPixelTimeMin && timeValue <= currPixelTimeMax;
    }

    overCursor(xPos, yPos) {
        return overCircle(xPos, yPos, floorPlanSelectorSize);
    }

    // If animation on, returns true if time is less than counter. Returns true if animation is off.
    testAnimation(timeValue) {
        if (animation) {
            let reMapTime = map(timeValue, timelineStart, timelineEnd, 0, totalTimeInSeconds);
            return animationCounter > reMapTime;
        } else return true;
    }

    testBugRecording(timeValue) {
        if (animation) return true;
        else if (videoIsPlaying) {
            let videoX = map(videoPlayer.getCurrentTime(), 0, totalTimeInSeconds, timelineStart, timelineEnd); // convert video time value in seconds to pixel position  
            if (videoX >= timeValue - bugPrecision && videoX <= timeValue + bugPrecision) return true;
        } else if (mouseY < timelineHeight && mouseX >= timeValue - bugPrecision && mouseX <= timeValue + bugPrecision) return true;
        else return false;
    }

    resetBug() {
        this.bugXPos = -1;
        this.bugYPos = -1;
        this.bugTimePos = -1;
    }
    recordBug(xPos, yPos, timePos) {
        this.bugXPos = xPos;
        this.bugYPos = yPos;
        this.bugTimePos = timePos;
        bugTimePosForVideo = timePos;
    }

    drawBug(shade) {
        stroke(0);
        strokeWeight(5);
        fill(shade);
        ellipse(this.bugXPos, this.bugYPos, bugSize, bugSize);
        ellipse(this.bugTimePos, this.bugYPos, bugSize, bugSize);
    }

    drawSlicer() {
        fill(0);
        stroke(0);
        strokeWeight(2);
        line(this.bugTimePos, 0, this.bugTimePos, timelineHeight);
    }
}

class DrawDataConversation {

    constructor() {
        this.conversationIsSelected = false;
        this.conversationToDraw = 0; //stores the Point_Conversation object
        this.view = 0
    }

    setData(path) {
        if (path.conversation.length > 0) this.setRects(path.conversation, path.name); // if path has conversation
    }

    setConversationBubble() {
        if (this.conversationIsSelected) this.drawTextBox(); // done last to be overlaid on top
    }

    numOfPaths() {
        let numOfPaths = 0; // determine how many paths are being drawn
        for (let i = 0; i < paths.length; i++) {
            let path = paths[i];
            if (path.show == true) numOfPaths++;
        }
        return numOfPaths;
    }

    // Test if point is showing and send to draw Rect depending on conversation mode
    setRects(points, pathName) {
        for (let i = 0; i < points.length; i++) {
            let point = points[i];
            let pixelTime = map(point.time, 0, totalTimeInSeconds, timelineStart, timelineEnd);
            if (this.overTimeline(pixelTime) && this.testAnimation(pixelTime)) {
                let curSpeaker = this.getSpeakerObject(points[i].speaker); // get speaker object equivalent to character
                if (curSpeaker.show) {
                    if (allConversation) this.drawRects(point, curSpeaker.color); // draws all rects
                    else {
                        if (curSpeaker.name === pathName) this.drawRects(point, curSpeaker.color); // draws rects only for speaker matching path
                    }
                }
            }
        }
    }

    drawRects(point, curColor) {
        noStroke(); // reset if setDrawText is called previously in loop
        textSize(1); // determines how many pixels a string is which corresponds to vertical height of rectangle
        let pixelTime = map(point.time, 0, totalTimeInSeconds, timelineStart, timelineEnd);
        let scaledTime = map(pixelTime, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
        let minRectHeight = 3; // for really short conversation turns set a minimum        
        let rectWidthMin = map(totalTimeInSeconds, 0, 3600, 10, 1, true); // map to inverse, values constrained between 10 and 1 (pixels)
        let rectWidthMax = 25;
        // map to inverse of min/max to set rectWidth based on amount of pixel time selected
        let rectWidth = map(currPixelTimeMax - currPixelTimeMin, 0, timelineLength, rectWidthMax, rectWidthMin);
        let rectLength = textWidth(point.talkTurn);
        if (rectLength < minRectHeight) rectLength = minRectHeight; // set small strings to minimum
        let xPos = point.xPos * displayFloorPlanWidth / inputFloorPlanPixelWidth; // scale to floor plan image file
        let yPos;
        if (conversationPositionTop) yPos = 0; // if conversation turn positioning is at top of screen
        else yPos = point.yPos * displayFloorPlanHeight / inputFloorPlanPixelHeight - rectLength;
        // setText sets stroke/strokeWeight to highlight rect if selected
        if (overRect(xPos, yPos, rectWidth, rectLength)) this.setText(point, PLAN); // if over plan
        else if (overRect(scaledTime, yPos, rectWidth, rectLength)) this.setText(point, SPACETIME); // if over spacetime
        fill(curColor); // Set color
        rect(xPos, yPos, rectWidth, rectLength); // Plan
        rect(scaledTime, yPos, rectWidth, rectLength); // Spacetime
    }

    // Returns speaker object based on string/character
    getSpeakerObject(s) {
        for (let i = 0; i < speakerList.length; i++) {
            if (speakerList[i].name === s) return speakerList[i];
        }
        return null; // Update with error handling here
    }

    setText(num, view) {
        this.conversationIsSelected = true;
        this.conversationToDraw = num;
        this.view = view;
        stroke(0);
        strokeWeight(4);
    }

    drawTextBox() {
        textFont(font_Lato, keyTextSize);
        textLeading(textSpacing);
        let point = this.conversationToDraw;
        let pixelTime = map(point.time, 0, totalTimeInSeconds, timelineStart, timelineEnd);
        let scaledTime = map(pixelTime, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
        let textBoxHeight = textSpacing * (ceil(textWidth(point.talkTurn) / textBoxWidth)); // lines of talk in a text box rounded up
        let xPos; // set xPos, constrain prevents drawing off screen
        if (this.view == PLAN) xPos = constrain((point.xPos * displayFloorPlanWidth / inputFloorPlanPixelWidth) - textBoxWidth / 2, boxSpacing, width - textBoxWidth - boxSpacing);
        else xPos = constrain(scaledTime - textBoxWidth / 2, 0, width - textBoxWidth - boxSpacing);
        let yPos, yDif;
        if (mouseY < height / 2) { //if top half of screen, text box below rectangle
            yPos = mouseY + boxDistFromRect;
            yDif = -boxSpacing;
        } else { //if bottom half of screen, text box above rectangle
            yPos = mouseY - boxDistFromRect - textBoxHeight;
            yDif = textBoxHeight + boxSpacing;
        }
        // textbox
        stroke(0); //set color to black
        strokeWeight(1);
        fill(255, 200); // transparency for textbox
        rect(xPos - boxSpacing, yPos - boxSpacing, textBoxWidth + 2 * boxSpacing, textBoxHeight + 2 * boxSpacing);
        fill(0);
        text(point.speaker + ": " + point.talkTurn, xPos, yPos, textBoxWidth, textBoxHeight); // text
        // conversation bubble
        stroke(255);
        strokeWeight(2);
        line(mouseX - boxDistFromRect, yPos + yDif, mouseX - boxDistFromRect / 2, yPos + yDif);
        stroke(0);
        strokeWeight(1);
        line(mouseX, mouseY, mouseX - boxDistFromRect, yPos + yDif);
        line(mouseX, mouseY, mouseX - boxDistFromRect / 2, yPos + yDif);
    }

    overTimeline(timeValue) {
        return timeValue >= currPixelTimeMin && timeValue <= currPixelTimeMax;
    }

    // If animation on, returns true if time is less than counter. Returns true if animation is off.
    testAnimation(timeValue) {
        if (animation) {
            let reMapTime = map(timeValue, timelineStart, timelineEnd, 0, totalTimeInSeconds);
            return animationCounter > reMapTime;
        } else return true;
    }
}