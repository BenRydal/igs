/*
Launches IGS as a p5 sketch in instance mode. p5 sketch, DOM and data are coordinated as follows:
    1) Various sketch classes update canvas-based visualizations
    2) Dom handler and controller classes update DOM based GUI
    3) Program data based on CSV files is stored in core class
    4) FloorPlan class holds image data and p5 drawing methods to represent images on the canvas
    5) VideoPlayer class is an abstract class that holds video data and p5 drawing methods to represent video on the canvas
    6) Additional 
*/

const igs = new p5((sk) => {

    sk.preload = function () {
        sk.font_Lato = sk.loadFont("data/fonts/Lato-Regular.ttf");
    }

    sk.setup = function () {
        sk.canvas = sk.createCanvas(window.innerWidth, window.innerHeight, sk.WEBGL);
        sk.canvas.parent('sketch-holder');
        sk.core = new Core(sk);
        sk.gui = new GUI(sk);
        sk.domHandler = new DomHandler(sk);
        sk.domController = new DomController(sk);
        sk.sketchController = new SketchController(sk);
        sk.handle3D = new Handle3D(sk, true);
        sk.videoPlayer = null;
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
    }

    sk.draw = function () {
        sk.background(255);
        sk.translate(-sk.width / 2, -sk.height / 2, 0); // recenter canvas to top left when using WEBGL renderer
        // Test/translate for 3D mode
        if (sk.handle3D.getIs3DModeOrTransitioning()) sk.handle3D.update3DTranslation();
        // Test/draw data
        if (sk.dataIsLoaded(sk.floorPlan.getImg())) sk.drawData();
        if (sk.sketchController.testVideoAndDivAreLoaded() && sk.sketchController.getIsVideoShow()) sk.sketchController.updateVideoDisplay();
        sk.gui.updateGUIWithTranslation();
        // Test/end translation for 3D mode
        if (sk.handle3D.getIs3DModeOrTransitioning()) sk.pop();
        sk.gui.updateGUI(); // draw gui last
        // Update animation and loop
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
        if (!sk.sketchController.getIsAnimate() && sk.gui.timelinePanel.isLockedOrOverTimeline()) sk.gui.timelinePanel.handle();
        sk.loop();
    }

    sk.mouseReleased = function () {
        if (sk.sketchController.getCurSelectTab() === 5 && !sk.handle3D.getIs3DModeOrTransitioning() && !sk.gui.timelinePanel.isLockedOrOverTimeline()) sk.gui.highlight.handleMouseRelease();
        sk.gui.timelinePanel.resetLock(); // reset after handlingHighlight
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