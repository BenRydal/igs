import P5Store from '../../stores/p5Store';
import UserStore from '../../stores/userStore';

import { Core, FloorPlan, SketchGUI, SketchController, Handle3D, VideoController, SetPathData } from '..';

import type { User } from '../../models/user';
import type p5 from 'p5';

let users: User[] = [];
let p5Instance: p5 | null = null;

UserStore.subscribe((data) => {
	users = data;
});

P5Store.subscribe((value) => {
	p5Instance = value;
});

/**
 * The main IGS sketch function.
 * @param p5 The p5 instance.
 */
export const igsSketch = (p5: any) => {
	P5Store.set(p5);

	p5.preload = () => {
		p5.font = p5.loadFont('/fonts/PlusJakartaSans/VariableFont_wght.ttf');
	};

	p5.setup = () => {
		const navbarHeight = (document.querySelector('.navbar') as HTMLElement).offsetHeight;
		const bottomNavHeight = (document.querySelector('.btm-nav') as HTMLElement).offsetHeight;

		const availableHeight = window.innerHeight - navbarHeight - bottomNavHeight;

		p5.createCanvas(window.innerWidth, availableHeight, p5.WEBGL);

		p5.core = new Core(p5);
		p5.sketchController = new SketchController(p5);
		p5.gui = new SketchGUI(p5);
		p5.handle3D = new Handle3D(p5, true);
		p5.videoController = new VideoController(p5);
		p5.floorPlan = new FloorPlan(p5);

		// Constants
		p5.PLAN = 0;
		p5.SPACE_TIME = 0;
		p5.GUI_TEXT_SIZE = p5.width / 70;

		// Styles
		p5.textSize(p5.GUI_TEXT_SIZE);
		p5.textFont(p5.font);
		p5.textAlign(p5.LEFT, p5.TOP);
		p5.smooth();
		p5.strokeCap(p5.SQUARE);
	};

	p5.draw = () => {
		p5.background(246, 245, 243);
		p5.translate(-p5.width / 2, -p5.height / 2, 0);

		if (p5.handle3D.getIs3DModeOrTransitioning()) {
			p5.push();
			p5.handle3D.update3DTranslation();
		}
		p5.visualizeData();
		p5.gui.update3D();

		if (p5.handle3D.getIs3DModeOrTransitioning()) p5.pop();
		p5.gui.update2D();
		if (p5.sketchController.getIsAnimate() && !p5.sketchController.getIsAnimatePause())
			p5.sketchController.updateAnimation(p5.domController.getAnimateSliderValue());

		if (
			(p5.sketchController.getIsAnimate() && !p5.sketchController.getIsAnimatePause()) ||
			p5.videoController.isLoadedAndIsPlaying() ||
			p5.handle3D.getIsTransitioning()
		) {
			p5.loop();
		} else p5.noLoop();
	};

	p5.mouseMoved = () => {
		p5.loop();
	};

	/**
	 * Checks if the data is loaded.
	 * @param data The data to check.
	 * @returns True if the data is loaded, false otherwise.
	 */
	p5.dataIsLoaded = (data: any) => {
		return data != null;
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

	/**
	 * Checks if the mouse is over a rectangle.
	 * @param x The x-coordinate of the rectangle.
	 * @param y The y-coordinate of the rectangle.
	 * @param boxWidth The width of the rectangle.
	 * @param boxHeight The height of the rectangle.
	 * @returns True if the mouse is over the rectangle, false otherwise.
	 */
	p5.overRect = (x: number, y: number, boxWidth: number, boxHeight: number) => {
		return p5.mouseX >= x && p5.mouseX <= x + boxWidth && p5.mouseY >= y && p5.mouseY <= y + boxHeight;
	};

	p5.windowResized = () => {
		const navbarHeight = (document.querySelector('.navbar') as HTMLElement).offsetHeight;
		const bottomNavHeight = (document.querySelector('.btm-nav') as HTMLElement).offsetHeight;

		const availableHeight = window.innerHeight - navbarHeight - bottomNavHeight;

		p5.resizeCanvas(window.innerWidth, availableHeight);
		p5.gui = new SketchGUI(p5);
		p5.GUITEXTSIZE = p5.width / 70;
		p5.textSize(p5.GUITEXTSIZE);
		p5.handle3D = new Handle3D(p5, p5.handle3D.getIs3DMode());
		p5.loop();
	};

	/**
	 * Checks if the data array is loaded.
	 * @param data The data array to check.
	 * @returns True if the data array is loaded, false otherwise.
	 */
	p5.arrayIsLoaded = (data: any) => {
		return Array.isArray(data) && data.length;
	};
};