import P5Store from '../../stores/p5Store';
import UserStore from '../../stores/userStore';
import P5, { type Sketch } from 'p5-svelte';
import { writable } from 'svelte/store';

import {
	Core,
	FloorPlan,
	SketchGUI,
	SketchController,
	Handle3D,
	VideoController,
	SetPathData
} from '..';

import type { User } from '../../models/user';
import type p5 from 'p5';

export const totalTime = writable(0);

let users: User[] = [];

UserStore.subscribe((data) => {
	users = data;
});

// P5Store.subscribe((value) => {
// 	p5Instance = value;
// });

export const igsSketch = (p5: any) => {
	P5Store.set(p5);

	p5.preload = () => {
		p5.font = p5.loadFont('/fonts/PlusJakartaSans/VariableFont_wght.ttf');
	};

	p5.setup = () => {
		p5.createCanvas(window.innerWidth, window.innerHeight - 160, p5.WEBGL);

		// Library classes
		const core = new Core(p5, 'in sketch');
		P5Store.update((state) => ({ ...state, core }));
		p5.core = core;

		p5.gui = new SketchGUI(p5);
		p5.sketchController = new SketchController(p5);
		p5.handle3D = new Handle3D(p5, true);

		const videoController = new VideoController(p5);
		P5Store.update((state) => ({ ...state, videoController }));
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

		if (p5.handle3D.getIs3DModeOrTransitioning()) {
			// Translate/update canvas if in 3D mode
			p5.push();
			p5.handle3D.update3DTranslation();
		}
		p5.visualizeData();
		p5.gui.update3D(); // draw canvas GUI elements that adapt to 3D mode

		if (p5.handle3D.getIs3DModeOrTransitioning()) p5.pop();
		p5.gui.update2D(); // draw all other canvas GUI elements in 2D mode
		if (p5.sketchController.getIsAnimate() && !p5.sketchController.getIsAnimatePause())
			p5.sketchController.updateAnimation(p5.domController.getAnimateSliderValue());
		// Determine whether to re-run draw loop depending on user adjustable modes
		// Might not be running because of not being able to sense if the data is being tracked and such.
		if (
			(p5.sketchController.getIsAnimate() && !p5.sketchController.getIsAnimatePause()) ||
			p5.videoController.isLoadedAndIsPlaying() ||
			p5.handle3D.getIsTransitioning()
		) {
			p5.loop();
		} else p5.noLoop();
	};

	p5.mouseMoved = () => {
		// if (p5.gui.timelinePanel.overEitherSelector()) p5.cursor(p5.HAND);
		// else if (p5.sketchController.getCurSelectTab() === 5) p5.cursor(p5.CROSS);
		// else p5.cursor(p5.ARROW);
		p5.loop();
	};

	p5.dataIsLoaded = (data: any) => {
		return data != null; // in javascript this tests for both undefined and null values
	};

	p5.visualizeData = () => {
		if (p5.dataIsLoaded(p5.floorPlan.getImg())) {
			p5.floorPlan.setFloorPlan(p5.gui.fpContainer.getContainer());
			if (p5.arrayIsLoaded(users)) {
				const setPathData = new SetPathData(p5, p5.core.codeList);
				if (p5.arrayIsLoaded(users)) {
					setPathData.setMovementAndConversation(users);
				}
			}
		}

		p5.videoController.updateDisplay();
	};

	// TODO: This needs to be moved eventually
	// Used by `timeline-panel.js` to determine whether to draw the timeline
	p5.overRect = (x: number, y: number, boxWidth: number, boxHeight: number) => {
		return (
			p5.mouseX >= x && p5.mouseX <= x + boxWidth && p5.mouseY >= y && p5.mouseY <= y + boxHeight
		);
	};

	p5.windowResized = () => {
		p5.resizeCanvas(window.innerWidth - 100, window.innerHeight - 100);
		p5.gui = new SketchGUI(p5); // update GUI vars
		p5.GUITEXTSIZE = p5.width / 70;
		p5.textSize(p5.GUITEXTSIZE);
		p5.handle3D = new Handle3D(p5, p5.handle3D.getIs3DMode()); // update 3D display vars, pass current 3D mode
		p5.loop();
	};

	// p5.overCircle = (x: number, y: number, diameter: number) => {
	//   return p5.sqrt(p5.sq(x - p5.mouseX) + p5.sq(y - p5.mouseY)) < diameter / 2;
	// }

	// p5.mousePressed = () => {
	//   if (!p5.sketchController.getIsAnimate() && p5.gui.timelinePanel.overTimeline() && !p5.gui.timelinePanel.overEitherSelector()) p5.videoController.timelinePlayPause();
	//   else if (p5.sketchController.getCurSelectTab() === 5 && !p5.handle3D.getIs3DModeOrTransitioning()) p5.gui.highlight.handleMousePressed();
	//   p5.loop();
	// }

	// p5.mouseDragged = () => {
	//   if (!p5.sketchController.getIsAnimate() && p5.gui.timelinePanel.isLockedOrOverTimeline()) p5.gui.timelinePanel.handle();
	//   p5.loop();
	// }

	// p5.mouseReleased = () => {
	//   if (p5.sketchController.getCurSelectTab() === 5 && !p5.handle3D.getIs3DModeOrTransitioning() && !p5.gui.timelinePanel.isLockedOrOverTimeline()) p5.gui.highlight.handleMouseRelease();
	//   p5.gui.timelinePanel.resetLock(); // reset after handlingHighlight
	//   p5.loop();
	// }

	// p5.mouseMoved = () => {
	//   if (p5.gui.timelinePanel.overEitherSelector()) p5.cursor(p5.HAND);
	//   else if (p5.sketchController.getCurSelectTab() === 5) p5.cursor(p5.CROSS);
	//   else p5.cursor(p5.ARROW);
	//   p5.loop();
	// }

	// p5.saveCodeFile = () => {
	//   if (p5.dataIsLoaded(p5.floorPlan.getImg()) && p5.arrayIsLoaded(p5.core.pathList)) {
	//     const setPathData = new SetPathData(p5, p5.core.codeList);
	//     setPathData.setCodeFile(p5.core.pathList);
	//   }
	// }

	// Used in core.js for tracking path and such
	p5.arrayIsLoaded = (data: any) => {
		return Array.isArray(data) && data.length;
	};
};
