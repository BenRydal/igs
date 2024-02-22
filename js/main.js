/*
Launches IGS as a p5 sketch in instance mode. p5 sketch, DOM and program data are coordinated as follows:
    1) Various sketch classes update canvas-based visualizations (SketchGUI, SketchController, Handle3D)
    2) Dom handler and Dom controller classes update DOM based GUI
    3) Program data based on CSV files is stored in core class
    4) FloorPlan class holds image data and p5 drawing methods to represent images on the canvas
    5) VideoPlayer controller holds an abstract class for a videoPlayer object and p5 drawing methods to represent video on the canvas
    6) Various draw classes represent paths as movement and conversation data
*/

import { Core } from './core/core.js';
import { SketchGUI } from './sketch-gui/sketch-gui.js';
import { SketchController } from './sketch/sketch-controller.js';
import { Handle3D } from './sketch/handle-3D.js';
import { DomHandler } from './dom-gui/dom-handler.js';
import { DomController } from './dom-gui/dom-controller.js';
import { addListeners } from './dom-gui/add-listeners.js';
import { FloorPlan } from './floorplan/floorplan.js';
import { SetPathData } from './draw/setPathData.js';
import { VideoController } from './video/video-controller.js';

const igs = new p5((sk) => {

    sk.preload = function() {
        sk.font_Lato = sk.loadFont("data/fonts/Lato-Regular.ttf");
    }

    sk.setup = function() {
        sk.canvas = sk.createCanvas(window.innerWidth, window.innerHeight, sk.WEBGL);
        sk.canvas.parent('sketch-holder');
        sk.core = new Core(sk);
        sk.gui = new SketchGUI(sk);
        sk.domHandler = new DomHandler(sk);
        sk.domController = new DomController(sk);
        sk.sketchController = new SketchController(sk);
        sk.handle3D = new Handle3D(sk, true);
        sk.videoController = new VideoController(sk);
        sk.floorPlan = new FloorPlan(sk);
        // CONSTANTS
        sk.PLAN = 0;
        sk.SPACETIME = 1;
        sk.GUITEXTSIZE = sk.width / 70;
        // STYLES
        sk.textSize(sk.GUITEXTSIZE);
        sk.textFont(sk.font_Lato);
        sk.textAlign(sk.LEFT, sk.TOP);
        sk.smooth(); // must enable when using WEBGL renderer
        addListeners(sk);
    }

    sk.draw = function() {
        sk.background(255);
        sk.translate(-sk.width / 2, -sk.height / 2, 0); // recenter canvas to top left when using WEBGL renderer
        if (sk.handle3D.getIs3DModeOrTransitioning()) { // Translate/update canvas if in 3D mode
            sk.push();
            sk.handle3D.update3DTranslation();
        }
        sk.visualizeData();
        sk.gui.update3D(); // draw canvas GUI elements that adapt to 3D mode
        if (sk.handle3D.getIs3DModeOrTransitioning()) sk.pop();
        sk.gui.update2D(); // draw all other canvas GUI elements in 2D mode
        if (sk.sketchController.getIsAnimate() && !sk.sketchController.getIsAnimatePause()) sk.sketchController.updateAnimation(sk.domController.getAnimateSliderValue());
        // Determine whether to re-run draw loop depending on user adjustable modes
        if ((sk.sketchController.getIsAnimate() && !sk.sketchController.getIsAnimatePause()) || sk.videoController.isLoadedAndIsPlaying() || sk.handle3D.getIsTransitioning()) sk.loop();
        else sk.noLoop();
    }

    /**
     * Determines what data is loaded and calls appropriate class drawing methods for that data
     */
    sk.visualizeData = function() {
        if (sk.dataIsLoaded(sk.floorPlan.getImg())) { // floorPlan must be loaded to draw any data
            sk.floorPlan.setFloorPlan(sk.gui.fpContainer.getContainer());
            if (sk.arrayIsLoaded(sk.core.pathList)) {
                const setPathData = new SetPathData(sk, sk.core.codeList);
                if (sk.arrayIsLoaded(sk.core.speakerList)) setPathData.setMovementAndConversation(sk.core.pathList, sk.core.speakerList);
                else setPathData.setMovement(sk.core.pathList);
            }
        }
        sk.videoController.updateDisplay();
    }

    sk.mousePressed = function() {
        if (!sk.sketchController.getIsAnimate() && sk.gui.timelinePanel.overTimeline() && !sk.gui.timelinePanel.overEitherSelector()) sk.videoController.timelinePlayPause();
        else if (sk.sketchController.getCurSelectTab() === 5 && !sk.handle3D.getIs3DModeOrTransitioning()) sk.gui.highlight.handleMousePressed();
        sk.loop();
    }

    sk.zzzUpdateStopValues = function() {
        for (const path of sk.core.pathList) {
            for (const point of path.movement) point.isStopped = false; // clear exisiting values first, then update
            for (const point of path.conversation) point.isStopped = false;
            sk.core.parseMovement.updateStopValues(path.movement);
            sk.core.parseMovement.updateStopValues(path.conversation);
        }
    }

    sk.mouseDragged = function() {
        if (!sk.sketchController.getIsAnimate() && sk.gui.timelinePanel.isLockedOrOverTimeline()) sk.gui.timelinePanel.handle();
        sk.loop();
    }

    sk.mouseReleased = function() {
        if (sk.sketchController.getCurSelectTab() === 5 && !sk.handle3D.getIs3DModeOrTransitioning() && !sk.gui.timelinePanel.isLockedOrOverTimeline()) sk.gui.highlight.handleMouseRelease();
        sk.gui.timelinePanel.resetLock(); // reset after handlingHighlight
        sk.loop();
    }

    sk.mouseMoved = function() {
        if (sk.gui.timelinePanel.overEitherSelector()) sk.cursor(sk.HAND);
        else if (sk.sketchController.getCurSelectTab() === 5) sk.cursor(sk.CROSS);
        else sk.cursor(sk.ARROW);
        sk.loop();
    }

    sk.saveCodeFile = function() {
        if (sk.dataIsLoaded(sk.floorPlan.getImg()) && sk.arrayIsLoaded(sk.core.pathList)) {
            const setPathData = new SetPathData(sk, sk.core.codeList);
            setPathData.setCodeFile(sk.core.pathList);
        }
    }

    sk.windowResized = function() {
        sk.resizeCanvas(window.innerWidth, window.innerHeight);
        sk.gui = new SketchGUI(sk); // update GUI vars
        sk.GUITEXTSIZE = sk.width / 70;
        sk.textSize(sk.GUITEXTSIZE);
        sk.handle3D = new Handle3D(sk, sk.handle3D.getIs3DMode()); // update 3D display vars, pass current 3D mode
        sk.loop();
    }

    sk.overCircle = function(x, y, diameter) {
        return sk.sqrt(sk.sq(x - sk.mouseX) + sk.sq(y - sk.mouseY)) < diameter / 2;
    }

    sk.overRect = function(x, y, boxWidth, boxHeight) {
        return sk.mouseX >= x && sk.mouseX <= x + boxWidth && sk.mouseY >= y && sk.mouseY <= y + boxHeight;
    }

    /**
     * @param  {Any Type} data
     */
    sk.dataIsLoaded = function(data) {
        return data != null; // in javascript this tests for both undefined and null values
    }

    sk.arrayIsLoaded = function(data) {
        return Array.isArray(data) && data.length;
    }
});