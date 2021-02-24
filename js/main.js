/*
This data visualization uses an approach called interaction geography to revisit a complete classroom science lesson from the Third International Mathematics and Science Study (TIMSS). The original data shown in this visualization was collected by TIMSS researchers and teachers and generously made publicly available at the following website to advance international teaching practice and studies of classroom interaction: https://www.timssvideo.com. As described on this website, the TIMSS Study "is a follow-up and expansion of the TIMSS 1995 Video Study of mathematics teaching. Larger and more ambitious than the first, the 1999 study investigated eighth-grade science as well as mathematics, expanded the number of countries from three to seven, and included more countries with relatively high achievement on TIMSS assessments in comparison to the United States."

CREDITS/LICENSE INFORMATION: This software is  licensed under the GNU General Public License Version 2.0. See the GNU General Public License included with this software for more details. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details. Data used in accordance with policies described on the TIMSS Video Study website. IGS software originally developed by Ben Rydal Shapiro at Vanderbilt University as part of his dissertation titled Interaction Geography & the Learning Sciences. Copyright (C) 2018 Ben Rydal Shapiro, and contributers. To reference or read more about this work please see: https://etd.library.vanderbilt.edu/available/etd-03212018-140140/unrestricted/Shapiro_Dissertation.pdf
*/

// TO DO:
// Conversation table error handling what if speakerList is 0?? e.g., how does getSpeakerObject work?
// basic error handling
// fix bug to always show last value if over to prevent blinking
// Remove some fonts
// check if removing "pause video" function screwed up bug line/shows at 0???
// revoke URLs

// Loads fonts, floor plan, and CSV file into p5.Table objects so that they can manipulated later
function preload() {
    font_PlayfairReg = loadFont("data/fonts/PlayfairDisplay-Regular.ttf");
    font_PlayfairItalic = loadFont("data/fonts/PlayfairDisplay-Italic.ttf");
    font_Playfairbold = loadFont("data/fonts/PlayfairDisplay-Bold.ttf");
    font_Lato = loadFont("data/fonts/Lato-Light.ttf");
    loadExample(example_1);
}

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight, P2D);
    pixelDensity(displayDensity());
    textFont(font_Lato, 14);
    textAlign(LEFT, TOP);
    setGUI();
}

function draw() {
    background(255);
    image(floorPlan, 0, 0, displayFloorPlanWidth, displayFloorPlanHeight);
    let keys = new Keys();
    keys.drawKeys();
    let drawData = new DrawData();
    for (let i = 0; i < paths.length; i++) {
        let path = paths[i];
        if (path.show) drawData.setDrawData(path);
    }
    drawData.setConversationBubble();
    if (howToRead) overButtonsMSGS();
    if (videoMode) {
        updateVideoScrubbing();
        if (videoIsPlaying) increaseVideoSize();
        else decreaseVideoSize();
    }
    if (intro) drawIntroMSG(introMSG); // draw intro message on program start up until mouse is pressed
    if (animation) setUpAnimation();
}

function setUpAnimation() {
    if (animationCounter < map(currPixelTimeMax, timelineStart, timelineEnd, 0, totalTimeInSeconds)) animationCounter++; // updates animation
    else animation = false;
}

function setGUI() {
    setBaseValues();
    setTextSizes();
    setConversationValues();
    setVideoValues();
}

function setBaseValues() {
    timelineStart = width * 0.4638;
    timelineEnd = width * 0.9638;
    timelineLength = timelineEnd - timelineStart;
    timelineHeight = height * .81;
    displayFloorPlanWidth = timelineStart - (width - timelineEnd);
    displayFloorPlanHeight = timelineHeight;
    currPixelTimeMin = timelineStart; // adjustable timeline values
    currPixelTimeMax = timelineEnd;
    yPosTimeScaleTop = timelineHeight - tickHeight;
    yPosTimeScaleBottom = timelineHeight + tickHeight;
    yPosTimeScaleSize = 2 * tickHeight;
    buttonSpacing = width / 71;
    buttonWidth = buttonSpacing;
    speakerKeysHeight = timelineHeight + (height - timelineHeight) / 4;
    buttonsHeight = timelineHeight + (height - timelineHeight) / 1.8;
    bugPrecision = 3;
    bugSize = width / 56;
}

function setTextSizes() {
    keyTextSize = width / 70;
    titleTextSize = width / 55;
    infoTextSize = width / 100;
}

function setConversationValues() {
    textBoxWidth = width / 3.5; // width of text and textbox drawn
    textSpacing = width / 57; // textbox leading
    boxSpacing = width / 141; // general textBox spacing variable
    boxDistFromRect = width / 28.2; // distance from text rectangle of textbox
}

function setVideoValues() {
    let video = select('#moviePlayer').position(timelineStart, 0); // position video in upper left corner on timeline
    videoWidthOnPause = width / 5;
    videoHeightOnPause = width / 6;
    videoWidthOnPlay = width - timelineStart;
    videoHeightOnPlay = height * .74;
    videoWidthPlayCounter = videoWidthOnPause;
    videoHeightPlayCounter = videoHeightOnPause;
}