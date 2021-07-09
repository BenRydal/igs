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

const testData = new TestData();

let igs = new p5((sketch) => {

    sketch.preload = function () {
        sketch.font_Lato = sketch.loadFont("data/fonts/Lato-Light.ttf");
    }

    sketch.setup = function () {
        sketch.canvas = sketch.createCanvas(window.innerWidth, window.innerHeight, sketch.P2D);
        /**
         * SINGLETONS with respective .js file/module
         */
        sketch.core = new Core(sketch); // core program variables and update methods
        sketch.keys = new Keys(sketch); // GUI vars and methods
        sketch.domController = new DomController(sketch); // handles DOM/buttons user interaction
        sketch.sketchController = new SketchController(sketch); // coordinates calls across classes and updates state variables
        sketch.processData = new ProcessData(sketch); // handles all data processing
        sketch.textFont(sketch.font_Lato);
        /**
         * CONSTANTS
         */
        sketch.PLAN = 0; // two drawing modes
        sketch.SPACETIME = 1;
        sketch.NO_DATA = -1;
    }

    sketch.draw = function () {
        sketch.background(255);
        if (testData.dataIsLoaded(sketch.core.floorPlan.img)) sketch.image(sketch.core.floorPlan.img, 0, 0, sketch.keys.floorPlan.width, sketch.keys.floorPlan.height);
        if (testData.arrayIsLoaded(sketch.core.paths)) {
            if (testData.arrayIsLoaded(sketch.core.speakerList)) sketch.setMovementAndConversation();
            else sketch.setMovement();
        }
        if (testData.dataIsLoaded(sketch.core.videoPlayer)) sketch.sketchController.updateVideoDisplay();
        sketch.keys.drawKeys(sketch.core.paths, sketch.core.speakerList); // draw keys last
        sketch.sketchController.updateAnimation();
        sketch.sketchController.updateLoop();
    }

    sketch.setMovementAndConversation = function () {
        const drawConversationData = new DrawDataConversation(sketch);
        const drawMovementData = new DrawDataMovement(sketch);
        for (const path of sketch.core.paths) {
            if (path.isShowing) {
                drawConversationData.setData(path, sketch.core.speakerList);
                drawMovementData.setData(path); // draw after conversation so bug displays on top
            }
        }
        drawConversationData.setConversationBubble(); // draw conversation text last so it displays on top
    }

    sketch.setMovement = function () {
        const drawMovementData = new DrawDataMovement(sketch);
        for (const path of sketch.core.paths) {
            if (path.isShowing) drawMovementData.setData(path); // draw after conversation so bug displays on top
        }
    }

    sketch.mousePressed = function () {
        sketch.sketchController.handleMousePressed();
        sketch.sketchController.startLoop();
    }

    sketch.mouseDragged = function () {
        sketch.sketchController.handleMouseDragged();
        sketch.sketchController.startLoop();
    }
    sketch.mouseReleased = function () {
        sketch.sketchController.handleMouseReleased();
        sketch.sketchController.startLoop();
    }
    sketch.mouseMoved = function () {
        sketch.sketchController.startLoop();
    }
});