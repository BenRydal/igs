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

/**
 * Classes/modules treated as singletons with respective .js file/module
 */
let core; // core program variables and update methods
let domController; // handles DOM/buttons user interaction
let sketchController; // coordinates calls across classes and updates state variables
let processData; // handles all data processing
let testData; // holds all tests for different program data
let keys; // GUI vars and methods

/**
 * Constants
 */
const CSVHEADERS_MOVEMENT = ['time', 'x', 'y']; // String array indicating movement movement file headers, data in each column should be of type number or it won't process
const CSVHEADERS_CONVERSATION = ['time', 'speaker', 'talk']; // String array indicating conversation file headers, data in time column shout be of type number, speaker column should be of type String, talk column should be not null or undefined
let font_Lato;
const PLAN = 0; // two drawing mode constants
const SPACETIME = 1;
const NO_DATA = -1;

function preload() {
    font_Lato = loadFont("data/fonts/Lato-Light.ttf");
}

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight, P2D);
    core = new Core();
    keys = new Keys();
    domController = new DomController();
    sketchController = new SketchController();
    processData = new ProcessData();
    testData = new TestData();
    textFont(font_Lato);
}

/**
 * Organizes draw loop depending on what data has been loaded
 */
function draw() {
    background(255);
    if (testData.dataIsLoaded(core.floorPlan.img)) image(core.floorPlan.img, 0, 0, keys.floorPlan.width, keys.floorPlan.height);
    if (testData.arrayIsLoaded(core.paths)) {
        if (testData.arrayIsLoaded(core.speakerList)) setMovementAndConversation();
        else setMovement();
    }
    if (testData.dataIsLoaded(core.videoPlayer)) sketchController.updateVideoDisplay();
    keys.drawKeys(core.paths, core.speakerList); // draw keys last
    sketchController.updateAnimation();
    sketchController.updateLoop();
}

function setMovementAndConversation() {
    const drawConversationData = new DrawDataConversation();
    const drawMovementData = new DrawDataMovement();
    for (const path of core.paths) {
        if (path.isShowing) {
            drawConversationData.setData(path, core.speakerList);
            drawMovementData.setData(path); // draw after conversation so bug displays on top
        }
    }
    drawConversationData.setConversationBubble(); // draw conversation text last so it displays on top
}

function setMovement() {
    const drawMovementData = new DrawDataMovement();
    for (const path of core.paths) {
        if (path.isShowing) drawMovementData.setData(path); // draw after conversation so bug displays on top
    }
}

function mousePressed() {
    sketchController.handleMousePressed();
    sketchController.startLoop();
}

function mouseDragged() {
    sketchController.handleMouseDragged();
    sketchController.startLoop();
}

function mouseReleased() {
    sketchController.handleMouseReleased();
    sketchController.startLoop();
}

function mouseMoved() {
    sketchController.startLoop();
}