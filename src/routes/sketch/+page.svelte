<script lang="ts">
  import P5 from "p5-svelte";

	import {
    Core,
		FloorPlan,
		SketchGUI,
		DomHandler,
		DomController,
		SketchController,
		Handle3D,
		VideoController,
		SetPathData
	} from "../../lib";

  const sketch = (p5: any) => {
		p5.preload = () => {
      p5.font = p5.loadFont("/fonts/PlusJakartaSans/VariableFont_wght.ttf");
    }

		p5.setup = () => {
			p5.createCanvas(window.innerWidth - 20, window.innerHeight - 70, p5.WEBGL);

			// Library support setup
			p5.core = new Core(p5);
			p5.gui = new SketchGUI(p5);
			p5.domHandler = new DomHandler(p5);
			p5.domController = new DomController(p5);
			p5.sketchController = new SketchController(p5);
			p5.handle3D = new Handle3D(p5, true);
			p5.videoController = new VideoController(p5);
			p5.floorPlan = new FloorPlan(p5);

			// Constants
			p5.PLAN = 0;
			p5.SPACE_TIME = 0;
			p5.GUI_TEXT_SIZE = p5.width / 70;

			// STYLES
			p5.textSize(p5.GUI_TEXT_SIZE);
			p5.textFont(p5.font);
			p5.textAlign(p5.LEFT, p5.TOP);
			p5.smooth();
		};

		p5.draw = () => {
			p5.background(255);
			p5.translate(-p5.width / 2, -p5.height / 2, 0); // recenter canvas to top left when using WEBGL renderer
			if (p5.handle3D.getIs3DModeOrTransitioning()) { // Translate/update canvas if in 3D mode
				p5.push();
				p5.handle3D.update3DTranslation();
			}
			p5.visualizeData();
			p5.gui.update3D(); // draw canvas GUI elements that adapt to 3D mode
			if (p5.handle3D.getIs3DModeOrTransitioning()) p5.pop();
			p5.gui.update2D(); // draw all other canvas GUI elements in 2D mode
			if (p5.sketchController.getIsAnimate() && !p5.sketchController.getIsAnimatePause()) p5.sketchController.updateAnimation(p5.domController.getAnimateSliderValue());

			// Determine whether to re-run draw loop depending on user adjustable modes
			if ((
        p5.sketchController.getIsAnimate() &&
        !p5.sketchController.getIsAnimatePause()) ||
        p5.videoController.isLoadedAndIsPlaying() ||
        p5.handle3D.getIsTransitioning()) {
          p5.loop();
      } else {
        p5.noLoop();
      }
		};

		/**
     * Determines what data is loaded and calls appropriate class drawing methods for that data
     */
    p5.visualizeData = () => {
      if (p5.dataIsLoaded(p5.floorPlan.getImg())) { // floorPlan must be loaded to draw any data
        p5.floorPlan.setFloorPlan(p5.gui.fpContainer.getContainer());

        if (p5.arrayIsLoaded(p5.core.pathList)) {
          const setPathData = new SetPathData(p5, p5.core.codeList);
          if (p5.arrayIsLoaded(p5.core.speakerList)) setPathData.setMovementAndConversation(p5.core.pathList, p5.core.speakerList);
          else setPathData.setMovement(p5.core.pathList);
        }
      }
      p5.videoController.updateDisplay();
    }

    p5.mousePressed = () => {
      if (!p5.sketchController.getIsAnimate() && p5.gui.timelinePanel.overTimeline() && !p5.gui.timelinePanel.overEitherSelector()) p5.videoController.timelinePlayPause();
      else if (p5.sketchController.getCurSelectTab() === 5 && !p5.handle3D.getIs3DModeOrTransitioning()) p5.gui.highlight.handleMousePressed();
      p5.loop();
    }

    p5.mouseDragged = () => {
      if (!p5.sketchController.getIsAnimate() && p5.gui.timelinePanel.isLockedOrOverTimeline()) p5.gui.timelinePanel.handle();
      p5.loop();
    }

    p5.mouseReleased = () => {
      if (p5.sketchController.getCurSelectTab() === 5 && !p5.handle3D.getIs3DModeOrTransitioning() && !p5.gui.timelinePanel.isLockedOrOverTimeline()) p5.gui.highlight.handleMouseRelease();
      p5.gui.timelinePanel.resetLock(); // reset after handlingHighlight
      p5.loop();
    }

    p5.mouseMoved = () => {
      if (p5.gui.timelinePanel.overEitherSelector()) p5.cursor(p5.HAND);
      else if (p5.sketchController.getCurSelectTab() === 5) p5.cursor(p5.CROSS);
      else p5.cursor(p5.ARROW);
      p5.loop();
    }

    p5.saveCodeFile = () => {
      if (p5.dataIsLoaded(p5.floorPlan.getImg()) && p5.arrayIsLoaded(p5.core.pathList)) {
        const setPathData = new SetPathData(p5, p5.core.codeList);
        setPathData.setCodeFile(p5.core.pathList);
      }
    }

    p5.windowResized = () => {
      p5.resizeCanvas(window.innerWidth - 100, window.innerHeight- 100);
      p5.gui = new SketchGUI(p5); // update GUI vars
      p5.GUITEXTSIZE = p5.width / 70;
      p5.textSize(p5.GUITEXTSIZE);
      p5.handle3D = new Handle3D(p5, p5.handle3D.getIs3DMode()); // update 3D display vars, pass current 3D mode
      p5.loop();
    }

    p5.overCircle = (x: number, y: number, diameter: number) => {
      return p5.sqrt(p5.sq(x - p5.mouseX) + p5.sq(y - p5.mouseY)) < diameter / 2;
    }

    p5.overRect = (x: number, y: number, boxWidth: number, boxHeight: number) => {
      return p5.mouseX >= x && p5.mouseX <= x + boxWidth && p5.mouseY >= y && p5.mouseY <= y + boxHeight;
    }

    p5.dataIsLoaded = (data: any) => {
      return data != null; // in javascript this tests for both undefined and null values
    }

    p5.arrayIsLoaded = (data: any) => {
      return Array.isArray(data) && data.length;
    }
	};
</script>

<!-- Put this part before </body> tag -->
<input type="checkbox" checked={true} id="my-modal" class="modal-toggle" />
<div class="modal">
  <div class="modal-box max-w-7xl">
    <div class="hero p-20">
      <div class="hero-content text-left">
        <div class="max-w-16">
          <h1 class="text-5xl font-bold pb-8">INTERACTION GEOGRAPHY SLICER (IGS)</h1>
          <p class="py-3">Hello! This is a tool to visualize movement, conversation, and video data over space and time. Data are displayed over a floor plan and a timeline and can be viewed in 2D or 3D.</p>
          <p class="py-3">Use the top menu to visualize different sample datasets or upload your own data. Use the bottom left tabs as well as the timeline to selectively study displayed data. For example, you can toggle individual movement paths and speakers, visualize conversation in different ways, animate data, and play/pause video by clicking anywhere on the timeline.</p>
          <p class="py-3">For further information, learn how to use and format your data for the IGS</p>
          <p class="pt-3 pb-6">IGS software is an open-source project built with JavaScript and p5.js licensed under the GNU General Public License Version 2.0. It is developed by Ben Rydal Shapiro and contributors with support from the National Science Foundation. Contribute | Reference | Learn More About Interaction Geography</p>
          <!-- <button class="btn btn-primary">Get Started</button> -->
          <div class="modal-action">
            <label for="my-modal" class="btn btn-primary">Get Started</label>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<P5 {sketch} />