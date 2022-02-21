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
        sk.handle3D = new Handle3D(sk, true); // boolean sets 3D to showing
        sk.videoPlayer = null; // abstract class for different video classes
        sk.floorPlan = new FloorPlan(sk);
        // CONSTANTS
        sk.PLAN = 0;
        sk.SPACETIME = 1;
        sk.DRAWGUI = 0;
        sk.HANDLEGUI = 1;
        sk.GUITEXTSIZE = sk.width / 70;
        sk.COLORGRAY = "#A9A9A9"; // matches checkmark color in DOM Controller
        // STYLES
        sk.textSize(sk.GUITEXTSIZE);
        sk.textFont(sk.font_Lato);
        sk.textAlign(sk.LEFT, sk.TOP);
        sk.smooth(); // must enable when using WEBGL renderer
    }

    sk.draw = function () {
        sk.background(255);
        sk.translate(-sk.width / 2, -sk.height / 2, 0); // recenter canvas to top left when using WEBGL renderer
        // test/translate for 3D mode
        if (sk.handle3D.getIs3DModeOrTransitioning()) sk.handle3D.update3DTranslation();
        // test/draw data
        if (sk.dataIsLoaded(sk.floorPlan.getImg())) sk.drawData();
        if (sk.sketchController.testVideoAndDivAreLoaded() && sk.sketchController.getIsVideoShow()) sk.sketchController.updateVideoDisplay();
        sk.gui.updateGUIWithTranslation();
        // test/end translation for 3D mode
        if (sk.handle3D.getIs3DModeOrTransitioning()) sk.pop();
        sk.gui.updateGUI(); // draw gui last
        // update animation and loop
        if (sk.sketchController.getIsAnimate() && !sk.sketchController.getIsAnimatePause()) sk.sketchController.updateAnimation();
        if ((sk.sketchController.getIsAnimate() && !sk.sketchController.getIsAnimatePause()) || sk.sketchController.getIsVideoPlay() || sk.handle3D.getIsTransitioning()) sk.loop();
        else sk.noLoop();
    }

    /**
     * Important: Floor plan must be loaded to draw any data
     */
    sk.drawData = function () {
        sk.floorPlan.setFloorPlan(sk.gui.fpContainer.getContainer());
        if (sk.arrayIsLoaded(sk.core.pathList)) {
            if (sk.arrayIsLoaded(sk.core.speakerList)) sk.setMovementAndConversation();
            else sk.setMovement();
        }
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
        if (sk.sketchController.testVideoToPlay()) sk.sketchController.playPauseVideoFromTimeline();
        else if (sk.sketchController.getCurSelectTab() === 5 && !sk.handle3D.getIs3DModeOrTransitioning()) sk.gui.highlight.handleMousePressed();
        sk.loop();
    }

    sk.mouseDragged = function () {
        if (!sk.sketchController.getIsAnimate()) sk.gui.timelinePanel.handle();
        sk.loop();
    }

    sk.mouseReleased = function () {
        sk.gui.timelinePanel.resetLock();
        if (sk.sketchController.getCurSelectTab() === 5 && !sk.handle3D.getIs3DModeOrTransitioning()) sk.gui.highlight.handleMouseRelease();
        sk.loop();
    }

    sk.mouseMoved = function () {
        if (sk.gui.timelinePanel.overEitherSelector()) sk.cursor(sk.HAND);
        else if (sk.sketchController.getCurSelectTab() === 5) sk.cursor(sk.CROSS);
        else sk.cursor(sk.ARROW);
        sk.loop();
    }

    sk.windowResized = function () {
        sk.resizeCanvas(window.innerWidth, window.innerHeight);
        sk.gui = new GUI(sk); // update GUI vars
        sk.GUITEXTSIZE = sk.width / 70;
        sk.textSize(sk.GUITEXTSIZE);
        sk.handle3D = new Handle3D(sk, sk.handle3D.getIs3DMode()); // update 3D display vars, pass current 3D mode
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

    sk.arrayIsLoaded = function (data) {
        return Array.isArray(data) && data.length;
    }
});