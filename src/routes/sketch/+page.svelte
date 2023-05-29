<script lang="ts">
  import MdHelpOutline from 'svelte-icons/md/MdHelpOutline.svelte'
  import MdCloudUpload from 'svelte-icons/md/MdCloudUpload.svelte'
  import MdCloudDownload from 'svelte-icons/md/MdCloudDownload.svelte'
  import MdRotateLeft from 'svelte-icons/md/MdRotateLeft.svelte'
  import MdRotateRight from 'svelte-icons/md/MdRotateRight.svelte'
  import MdMenu from 'svelte-icons/md/MdMenu.svelte'
  import Md3DRotation from 'svelte-icons/md/Md3DRotation.svelte'

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
		SetPathData,
    AddListeners
	} from "../../lib";

  let selectedTab = "Movement";
  let tabOptions = [
    'Movement',
    'Talk',
    'Video',
    'Animate',
    'Select',
    'Floor Plan',
    'Codes',
    'Export'
  ]

  const sketch = (p5: any) => {
		p5.preload = () => {
      p5.font = p5.loadFont("/fonts/PlusJakartaSans/VariableFont_wght.ttf");
    }

		p5.setup = () => {
			p5.createCanvas(window.innerWidth - 20, window.innerHeight - 160, p5.WEBGL);

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

    // TEMP
      // p5.domHandler.loadExampleData(['/data/example-3/', 'floorplan.png', 'conversation.csv', ['Teacher.csv', 'lesson-graph.csv'], 'Youtube', {
      //               videoId: 'Iu0rxb-xkMk'
      //           }]);

      // addListeners(sk);
      AddListeners(p5);
      // document.getElementById("upload-file-btn")?.addEventListener("click", () => {
      //   console.log("Helloz")
      // })
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

    const test = () => {
      console.log("Test function.")
    }
	};

  console.log(Object.getOwnPropertyNames(sketch));
</script>

<div class="drawer">
  <input id="my-drawer" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content">
    <!-- Page content here -->
    <div class="navbar min-h-16 bg-[#47606e] text-base-100">
      <div class="flex-1 px-2 lg:flex-none">
        <label for="my-drawer" class="btn btn-primary drawer-button">Open drawer</label>
      </div>

      <div class="flex justify-end flex-1 px-2">
        <div class="flex items-stretch">
          <div class="btn icon max-h-8">
            <MdRotateLeft />
          </div>
          <div class="btn icon max-h-8">
            <MdRotateRight />
          </div>
          <div class="btn icon max-h-8">
            <MdCloudDownload />
          </div>
          <div id="btn-load-files" class="btn icon max-h-8">
            <MdCloudUpload />
          </div>
          <div id="btn-help" class="btn icon max-h-8">
            <MdHelpOutline />
          </div>
          <div id="btn-toggle-3d" class="btn icon max-h-8">
            <Md3DRotation />
          </div>
          <select id="select-data-dropdown" class="select select-bordered w-full max-w-xs bg-neutral">
            <option disabled selected>-- Select an Option --</option>
            <option value="Example 1">Load Data</option>
            <option value="Example 1">EXAMPLE 1: MICHAEL JORDAN'S LAST SHOT</option>
            <option value="Example 2">EXAMPLE 2: FAMILY MUSEUM GALLERY VISIT</option>
            <option value="Example 3">EXAMPLE 3: CLASSROOM SCIENCE LESSON</option>
            <option value="Example 4">EXAMPLE 4: CLASSROOM DISCUSSION</option>
          </select>
        </div>
      </div>
    </div>

    <div class="btm-nav">
      <div class="flex-1 px-2 lg:flex-none">
        <select bind:value={selectedTab} id="select-data-dropdown" class="select select-bordered w-full max-w-xs bg-neutral text-white dropdown-top">
          {#each tabOptions as value}<option {value}>{value}</option>{/each}
        </select>
      </div>
      <div>
        {#if selectedTab == 'Movement'}
        <input class="tab-radio" id="main-tab-1" name="main-group" type="radio" checked="checked">
        <div class="tab-content" id="movement-main-tab">
            <div class="sub-tabs-container button-float">
                <label for="sub-tab1-1" title="Click to change and set colors">Change Color</label>
            </div>
            <!-- Sub Tabs -->
            <input class="tab-radio js-color-change" id="sub-tab1-1" name="sub-group1" type="checkbox">
        </div>
        {/if}
        {#if selectedTab == 'Talk'}
        <input class="tab-radio" id="main-tab-3" name="main-group" type="radio">
        <div class="tab-content loop-sketch" id="talk-main-tab">
            <div class="sub-tabs-container button-float">
                <input type="search" id="sub-tab3-1" name="search-input" placeholder="Search">
                <label for="sub-tab3-2" title="Align talk along top">Align</label>
                <label for="sub-tab3-3" title="Show talk by all speakers along each movement path">All On
                    Path</label>
                <label for="sub-tab3-4" title="Click to change and set colors">Change
                    Color</label>
            </div>
            <input class="tab-radio" id="sub-tab3-2" name="sub-group3" type="checkbox">
            <input class="tab-radio" id="sub-tab3-3" name="sub-group3" type="checkbox">
            <input class="tab-radio js-color-change" id="sub-tab3-4" name="sub-group3" type="checkbox">
        </div>
        {/if}
        {#if selectedTab == 'Video'}
        <input class="tab-radio" id="main-tab-4" name="main-group" type="radio">
        <div class="tab-content loop-sketch">
            <div class="sub-tabs-container">
                <label for="sub-tab4-1">Show/Hide</label>
                <label for="sub-tab4-2">Play/Pause</label>
                <label for="sub-tab4-3">+</label>
                <label for="sub-tab4-4">-</label>
            </div>
            <input class="tab-radio" id="sub-tab4-1" name="sub-group4" type="checkbox">
            <input class="tab-radio" id="sub-tab4-2" name="sub-group4" type="checkbox">
            <input class="tab-radio" id="sub-tab4-3" name="sub-group4" type="checkbox">
            <input class="tab-radio" id="sub-tab4-4" name="sub-group4" type="checkbox">
        </div>
        {/if}
        {#if selectedTab == 'Animate'}
        <input class="tab-radio" id="main-tab-5" name="main-group" type="radio">
        <div class="tab-content loop-sketch">
            <div class="sub-tabs-container">
                <label for="sub-tab5-1">Start/End</label>
                <label for="sub-tab5-2">Play/Pause</label>
                <!-- <label class= "zzzTest" for="animate-speed-slider">Speed</label> -->
                <input class="slider" id="animate-speed-slider" type="range" min="100" max="8000" value="4000">
            </div>
            <input class="tab-radio" id="sub-tab5-1" name="sub-group5" type="checkbox">
            <input class="tab-radio" id="sub-tab5-2" name="sub-group5" type="checkbox">
        </div>

        {/if}
        {#if selectedTab == 'Select'}
        <input class="tab-radio" id="main-tab-6" name="main-group" type="radio">
        <div class="tab-content loop-sketch">
            <div class="sub-tabs-container">
                <label for="sub-tab6-1" title="Reset selectors">Reset</label>
                <label for="sub-tab6-2" title="Hover to highlight circular regions of data (2D only)">Circle</label>
                <label for="sub-tab6-3" title="Hover to highlight rectangular slices of data (2D only)">Slice</label>
                <label for="sub-tab6-4" title="Highlight only movement">Movement</label>
                <label for="sub-tab6-5" title="Highlight only stops">Stops</label>
                <label for="sub-tab6-6" title="Drag to select rectangular regions of data in 2D View. Hold option key to select multiple regions.">Highlight</label>
            </div>
            <input class="tab-radio" id="sub-tab6-1" name="sub-group6" type="radio">
            <input class="tab-radio" id="sub-tab6-2" name="sub-group6" type="radio">
            <input class="tab-radio" id="sub-tab6-3" name="sub-group6" type="radio">
            <input class="tab-radio" id="sub-tab6-4" name="sub-group6" type="radio">
            <input class="tab-radio" id="sub-tab6-5" name="sub-group6" type="radio">
            <input class="tab-radio" id="sub-tab6-6" name="sub-group6" type="radio">
        </div>
        {/if}
        {#if selectedTab == 'Floor Plan'}
        <input class="tab-radio" id="main-tab-7" name="main-group" type="radio">
        <div class="tab-content loop-sketch">
            <div class="sub-tabs-container">
                <label for="sub-tab7-1">Rotate Left</label>
                <label for="sub-tab7-2">Rotate Right</label>
            </div>
            <input class="tab-radio" id="sub-tab7-1" name="sub-group7" type="checkbox">
            <input class="tab-radio" id="sub-tab7-2" name="sub-group7" type="checkbox">
        </div>
        {/if}
        {#if selectedTab == 'Codes'}
        <input class="tab-radio" id="main-tab-8" name="main-group" type="radio">
        <div class="tab-content loop-sketch" id="codes-main-tab">
            <div class="sub-tabs-container button-float">
                <label for="sub-tab8-1" title="Color data by codes files (grey = no code and black = multiple codes)">Color
                    By Codes</label>
                <label for="sub-tab8-2" style="display: none" title="Click to change and set colors">Change
                    Color</label>
            </div>
            <input class="tab-radio" id="sub-tab8-1" name="sub-group8" type="checkbox">
            <input class="tab-radio js-color-change" id="sub-tab8-2" name="sub-group8" type="checkbox">
        </div>
        {/if}
        {#if selectedTab == 'Export'}
        <input class="tab-radio" id="main-tab-9" name="main-group" type="radio">
        <div class="tab-content loop-sketch">
            <div class="sub-tabs-container">
                <label for="sub-tab9-1" title="Click to create code files from selected/displayed data">Code File</label>
            </div>
            <input class="tab-radio" id="sub-tab9-1" name="sub-group8" type="checkbox">
        </div>
        {/if}
      </div>
    </div>

    <slot />
  </div>
  <div class="drawer-side">
    <label for="my-drawer" class="drawer-overlay"></label>
    <ul class="menu p-4 w-80 bg-base-100 text-base-content">
      <!-- Sidebar content here -->
      <li>Movement</li>
      <li>Talk</li>
      <li>Video</li>
      <li>Select</li>
      <li>Codes</li>
      <li>Export</li>
      <li>2D</li>
      <li>3D</li>
    </ul>
  </div>
</div>

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