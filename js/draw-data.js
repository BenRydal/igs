// if (selectorSliceEnabled && (pos.x < mouseX - selectorSliceWidth || pos.x > mouseX + selectorSliceWidth) && (xPosTimeline < mouseX - selectorSliceWidth || xPosTimeline > mouseX + selectorSliceWidth)) return false;

// Super class with 2 sub-classes drawDataMovement and drawDataConversation
class DrawData {

    constructor() {
        this.drawConversation = new DrawDataConversation();
        this.drawMovement = new DrawDataMovement();
    }

    setDrawData(path) {
        if (conversationView_1 || conversationView_2) this.drawConversation.setData(path);
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
        // if selectRegion then program draws 1 shape for each movement path in space and space-time and also many shapes for region that is selected

        if (selectRegion) {
            this.draw(PLAN, path.movement, 150);
            this.draw(SPACETIME, path.movement, 150);
            this.drawRegion(PLAN, path.movement, path.color);
            this.drawRegion(SPACETIME, path.movement, path.color);

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
        for (var i = 0; i < animationCounter; i++) {
            var point = points[i];
            if (this.overTimeline(point.time)) {
                var scaledTime = map(point.time, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
                if (view == PLAN) curveVertex(point.xPos, point.yPos);
                else if (view == SPACETIME) { // text/get bug values
                    curveVertex(scaledTime, point.yPos);
                    if (videoIsPlaying) {
                        // convert video time value in seconds to pixel position                   
                        var videoX = map(getMovieCurrentTime(), 0, videoDuration, timelineStart, timelineEnd);
                        if (videoX >= scaledTime - bugPrecision && videoX <= scaledTime + bugPrecision) {
                            this.recordBug(point.xPos, point.yPos, scaledTime);
                        }
                    } else if (mouseY < timelineHeight && mouseX >= scaledTime - bugPrecision && mouseX <= scaledTime + bugPrecision) {
                        this.recordBug(point.xPos, point.yPos, scaledTime);
                    } else if (animation && i <= animationCounter - 1) {
                        this.recordBug(point.xPos, point.yPos, scaledTime);
                    }
                }
            }
        }
        endShape();
    }

    // Draws only shapes for selected regions
    drawRegion(view, points, shade) {
        strokeWeight(pathWeight * 2);
        stroke(shade);
        noFill(); // important for curve drawing
        var drawVertex = false; // set false to start
        for (var i = 0; i < animationCounter; i++) {
            var drawEndpoint = false; // boolean to draw additional endpoints for each shape to make sure all points included
            var point = points[i];
            // Tests if overTimeline/Region and adjusts begin/end shape and boolean drawVertex to draw only that shape
            if (this.overTimeline(point.time) && this.overRegion(point.xPos, point.yPos)) {
                if (!drawVertex) { // beginShape if no shape yet and set drawVertex to true
                    beginShape();
                    drawEndpoint = true;
                    drawVertex = true;
                }
            } else { // if not overtimeline and overRegion endShape and set drawVertex to false
                if (drawVertex) {
                    drawEndpoint = true;
                    endShape();
                    drawVertex = false;
                }
            }
            // Draw vertex if true in space and space-time
            if (drawVertex || drawEndpoint) {
                var scaledTime = map(point.time, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
                if (view == PLAN) curveVertex(point.xPos, point.yPos);
                else if (view == SPACETIME) curveVertex(scaledTime, point.yPos);
                if (drawEndpoint) {
                    if (view == PLAN) curveVertex(point.xPos, point.yPos);
                    else if (view == SPACETIME) curveVertex(scaledTime, point.yPos);
                }
            }
        }
        if (drawVertex) endShape(); // endShape if still true
    }

    overTimeline(timeValue) {
        if (timeValue >= currPixelTimeMin && timeValue <= currPixelTimeMax) return true;
        else return false;
    }

    overRegion(xPos, yPos) {
        if (overCircle(xPos, yPos, 50)) return true;
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
        if (path.conversation.length > 0) this.drawRects(path.conversation, path.name); // if path has conversation
    }

    setConversationBubble() {
        if (this.conversationIsSelected) this.drawTextBox(); // done last to be overlaid on top
    }

    numOfPaths() {
        var numOfPaths = 0; // determine how many paths are being drawn
        for (var i = 0; i < paths.length; i++) {
            var path = paths[i];
            if (path.show == true) numOfPaths++;
        }
        return numOfPaths;
    }

    // Draws rect if speaker is selected UPDATE???
    drawRects(points, speaker) {
        var conversationAnimationRatio = float(animationCounter) / float(animationMaxValue); // for animation of conversation at same speed as movement
        var rectSize = 1; // controls vertical height of rectangle (length of conversation turn)
        var minConversationRectLength = 5;
        // TEMP!
        var conversationRectWidth = 18 - (map(currPixelTimeMax - currPixelTimeMin, 0, timelineEnd - timelineStart, 3, 16));

        for (var i = 0; i < floor(points.length * conversationAnimationRatio); i++) {
            var point = points[i];
            if (point.time >= currPixelTimeMin && point.time <= currPixelTimeMax) {
                var scaledTime = map(point.time, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
                let curSpeaker = this.getSpeakerObject(points[i].speaker); // get speaker object equivalent to character

                if (curSpeaker.show) { // If speaker code is showing/true/selected in GUI
                    noStroke(); // reset if setDrawText is called previously in loop
                    textSize(rectSize); // controls length/size of rect drawn
                    var conversationLength = textWidth(point.talkTurn);
                    if (conversationLength < minConversationRectLength) conversationLength = minConversationRectLength; // set small strings to minimum
                    if (conversationView_2) {
                        var xPos = point.xPos;
                        var yPos = 0;
                    } else {
                        var xPos = point.xPos;
                        var yPos = point.yPos - conversationLength;
                    }
                    // setText sets stroke/strokeWeight to highlight rect if selected
                    if (overRect(xPos, yPos, conversationRectWidth, conversationLength)) this.setText(points[i], PLAN); // if over plan
                    else if (overRect(scaledTime, yPos, conversationRectWidth, conversationLength)) this.setText(points[i], SPACETIME); // if over spacetime
                    
                    fill(curSpeaker.color); // Set color
                    rect(xPos, yPos, conversationRectWidth, conversationLength); // Plan
                    rect(scaledTime, yPos, conversationRectWidth, conversationLength); // Spacetime

                }
            }
        }
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
        var point = this.conversationToDraw;
        var scaledTime = map(point.time, currPixelTimeMin, currPixelTimeMax, timelineStart, timelineEnd);
        var textBoxHeight = textSpacing * (ceil(textWidth(point.talkTurn) / textBoxWidth)); // lines of talk in a text box rounded up
        // set xPos, constrain prevents drawing off screen
        if (this.view == PLAN) var xPos = constrain(point.xPos - textBoxWidth / 2, boxSpacing, width - textBoxWidth - boxSpacing);
        else if (this.view == SPACETIME) var xPos = constrain(scaledTime - textBoxWidth / 2, 0, width - textBoxWidth - boxSpacing);
        // set yPos
        if (mouseY < height / 2) { //if top half of screen, text box below rectangle
            var yPos = mouseY + boxDistFromRect;
            var differential = -boxSpacing;
        } else { //if bottom half of screen, text box above rectangle
            var yPos = mouseY - boxDistFromRect - textBoxHeight;
            var differential = textBoxHeight + boxSpacing;
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
        line(mouseX - boxDistFromRect, yPos + differential, mouseX - boxDistFromRect / 2, yPos + differential);
        stroke(0);
        strokeWeight(1);
        line(mouseX, mouseY, mouseX - boxDistFromRect, yPos + differential);
        line(mouseX, mouseY, mouseX - boxDistFromRect / 2, yPos + differential);
    }
}