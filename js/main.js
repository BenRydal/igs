/*
CREDITS/LICENSE INFORMATION: 
This software is written in JavaScript and p5.js and uses YouTube and Kaltura Video Player APIs and the PapaParse library by Matt Holt for CSV file processing. 
This software is licensed under the GNU General Public License Version 2.0. 
See the GNU General Public License included with this software for more details. 
Classroom discussion example data is used with special permission from Mathematics Teaching and Learning to Teach (MTLT), 
University of Michigan. (2010). Sean Numbers-Ofala. Classroom science lesson data is made possible by the researchers 
and teachers who created The Third International Mathematics and Science Study (TIMSS) 1999 Video Study. 
IGS software was originally developed by Ben Rydal Shapiro at Vanderbilt University 
as part of his dissertation titled Interaction Geography & the Learning Sciences. 
Copyright (C) 2018 Ben Rydal Shapiro, and contributors. 
To reference or read more about this work please see: 
https://etd.library.vanderbilt.edu/available/etd-03212018-140140/unrestricted/Shapiro_Dissertation.pdf
*/

const igs = new p5((sk) => {

    sk.preload = function () {
        sk.font_Lato = sk.loadFont("data/fonts/Lato-Regular.ttf");
    }

    sk.setup = function () {
        sk.canvas = sk.createCanvas(window.innerWidth, window.innerHeight, sk.WEBGL);
        sk.canvas.parent('sketch-holder');
        sk.core = new Core(sk); // holds core data, update and parsing methods/classes
        sk.gui = new GUI(sk); // holds GUI elements/classes
        sk.domController = new DomController(sk); // handles DOM/buttons user interaction
        sk.sketchController = new SketchController(sk); // coordinates calls across classes
        sk.videoPlayer = null; // abstract class for different video classes
        sk.inputFloorPlan = new InputFloorPlan(sk);
        // CONSTANTS
        sk.PLAN = 0;
        sk.SPACETIME = 1;
        sk.DRAWGUI = 0;
        sk.HANDLEGUI = 1;
        sk.GUITEXTSIZE = sk.width / 70;
        sk.COLORGRAY = "#A9A9A9"; // this color matches checkmark color in DOM Controller
        // STYLES
        sk.textSize(sk.GUITEXTSIZE);
        sk.textFont(sk.font_Lato);
        sk.textAlign(sk.LEFT, sk.TOP);
        sk.smooth(); // must enable when using 3D
    }

    sk.draw = function () {
        sk.background(255);
        sk.translate(-sk.width / 2, -sk.height / 2, 0); // always recenter canvas to top left when using WEBGL renderer
        // 3D translation test
        if (sk.sketchController.handle3D.getIsShowing() || sk.sketchController.handle3D.getIsTransitioning()) sk.sketchController.handle3D.update3DTranslation();

        if (sk.dataIsLoaded(sk.inputFloorPlan.getImg())) sk.inputFloorPlan.setFloorPlan(sk.gui.fpContainer.getContainer());


        if (sk.arrayIsLoaded(sk.core.pathList)) {
            if (sk.arrayIsLoaded(sk.core.speakerList)) sk.setMovementAndConversation();
            else sk.setMovement();
        }
        if (sk.sketchController.testVideoAndDivAreLoaded()) sk.sketchController.updateVideoDisplay();
        if (sk.sketchController.handle3D.getIsShowing()) sk.sketchController.update3DSlicerRect();
        // 3D translation test
        if (sk.sketchController.handle3D.getIsShowing() || sk.sketchController.handle3D.getIsTransitioning()) sk.pop();
        sk.gui.updateGUI(); // draw keys last
        sk.sketchController.updateAnimation();
        sk.sketchController.updateLoop();
    }

    sk.setMovement = function () {
        const drawMovement = new DrawMovement(sk);
        for (const path of sk.core.pathList) {
            if (path.isShowing) drawMovement.setData(path); // draw after conversation so dot displays on top
        }
    }

    sk.setMovementAndConversation = function () {
        const drawConversation = new DrawConversation(sk);
        const drawMovement = new DrawMovement(sk);
        for (const path of sk.core.pathList) {
            if (path.isShowing) {
                drawConversation.setData(path, sk.core.speakerList);
                drawMovement.setData(path); // draw after conversation so dot displays on top
            }
        }
        drawConversation.setConversationBubble(); // draw conversation text last so it displays on top
    }

    sk.mousePressed = function () {
        if (this.sketchController.testVideoToPlay()) this.sketchController.playPauseVideoFromTimeline();
        // Called on mousePressed and overCanvas and in highlight mode
        // TODO: add overspace-time view
        //else if (this.sketchController.getCurSelectTab() === 5 && (this.gui.fpContainer.overFloorPlan(this.mouseX, this.mouseY) || this.gui.timelinePanel.overTimeline(this.mouseX, this.mouseY))) {
        else if (this.sketchController.getCurSelectTab() === 5) {
            this.gui.highlight.startHighlight(this.mouseX, this.mouseY);
        }
        this.loop();
    }

    sk.mouseDragged = function () {
        if (!this.sketchController.getIsAnimate()) this.gui.timelinePanel.handle();
        this.loop();
    }

    sk.mouseReleased = function () {
        this.gui.timelinePanel.resetLock();
        if (this.sketchController.getCurSelectTab() === 5) {
            if (!(this.keyIsPressed && this.keyCode === this.OPTION)) this.sketchController.resetHighlightArray();
            if (this.gui.highlight.isHighlighting()) this.sketchController.updateHighlightArray(this.gui.highlight.createHighlightRect(this.mouseX, this.mouseY));
            this.gui.highlight.endHighlight();
        }
        this.loop();
    }

    sk.mouseMoved = function () {
        if (this.gui.timelinePanel.overEitherSelector()) this.cursor(this.HAND);
        else this.cursor(this.ARROW);
        this.loop();
    }

    sk.windowResized = function () {
        sk.resizeCanvas(window.innerWidth, window.innerHeight);
        sk.gui = new GUI(sk); // update GUI vars
        sk.GUITEXTSIZE = sk.width / 70;
        sk.textSize(sk.GUITEXTSIZE);
        sk.sketchController.handle3D = new Handle3D(sk, sk.sketchController.handle3D.isShowing); // update 3D display vars, pass current 3D showing mode
        sk.loop();
    }

    sk.overCircle = function (x, y, diameter) {
        return sk.sqrt(sk.sq(x - sk.mouseX) + sk.sq(y - sk.mouseY)) < diameter / 2;
    }

    sk.overRect = function (x, y, boxWidth, boxHeight) {
        return sk.mouseX >= x && sk.mouseX <= x + boxWidth && sk.mouseY >= y && sk.mouseY <= y + boxHeight;
    }

    /**
     * @param  {Any Type} data
     */
    sk.dataIsLoaded = function (data) {
        return data != null; // in javascript this tests for both undefined and null values
    }

    /**
     * @param  {Any Type} data
     */
    sk.arrayIsLoaded = function (data) {
        return Array.isArray(data) && data.length;
    }
});