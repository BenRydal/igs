import P5Store from '../../stores/p5Store';
import UserStore from '../../stores/userStore';

import { Core, FloorPlan, SketchGUI, SketchController, Handle3D, VideoController, SetPathData } from '..';

import type { User } from '../../models/user';
import type p5 from 'p5';

import ConfigStore, { type ConfigStoreType } from '../../stores/configStore';
import { get } from 'svelte/store';

let users: User[] = [];
let p5Instance: p5 | null = null;

UserStore.subscribe((data) => {
	users = data;
});

P5Store.subscribe((value) => {
	p5Instance = value;
});

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

		p5.sketchController = new SketchController(p5);
		p5.gui = new SketchGUI(p5);
		p5.handle3D = new Handle3D(p5, true);
		p5.videoController = new VideoController(p5);
		p5.floorPlan = new FloorPlan(p5);

		// Constants
		p5.PLAN = 0;
		p5.GUI_TEXT_SIZE = p5.width / 70;

		// STYLES
		p5.textSize(p5.GUI_TEXT_SIZE);
		p5.textFont(p5.font);
		p5.textAlign(p5.LEFT, p5.TOP);
		p5.smooth();
		p5.strokeCap(p5.SQUARE);
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
		if (p5.sketchController.getIsAnimate()) p5.sketchController.updateAnimation();
		// Determine whether to re-run draw loop depending on user adjustable modes
		// Might not be running because of not being able to sense if the data is being tracked and such.
		if (p5.sketchController.getIsAnimate() || p5.videoController.isLoadedAndIsPlaying() || p5.handle3D.getIsTransitioning()) {
			p5.loop();
		} else p5.noLoop();
	};

	p5.mouseMoved = () => {
		p5.loop();
	};

	p5.dataIsLoaded = (data: any) => {
		return data != null; // in javascript this tests for both undefined and null values
	};

	p5.visualizeData = () => {
		if (p5.dataIsLoaded(p5.floorPlan.getImg())) {
			p5.floorPlan.setFloorPlan(p5.gui.fpContainer.getContainer());
			if (p5.arrayIsLoaded(users)) {
				const setPathData = new SetPathData(p5);
				setPathData.setMovementAndConversation(users);
			}
		}

		p5.videoController.updateDisplay();
	};

	// TODO: This needs to be moved eventually
	// Used by `timeline-panel.js` to determine whether to draw the timeline
	p5.overRect = (x: number, y: number, boxWidth: number, boxHeight: number) => {
		return p5.mouseX >= x && p5.mouseX <= x + boxWidth && p5.mouseY >= y && p5.mouseY <= y + boxHeight;
	};

	p5.windowResized = () => {
		const navbarHeight = (document.querySelector('.navbar') as HTMLElement).offsetHeight;
		const bottomNavHeight = (document.querySelector('.btm-nav') as HTMLElement).offsetHeight;

		const availableHeight = window.innerHeight - navbarHeight - bottomNavHeight;

		p5.resizeCanvas(window.innerWidth, availableHeight);
		p5.gui = new SketchGUI(p5); // update GUI vars
		p5.GUITEXTSIZE = p5.width / 70;
		p5.textSize(p5.GUITEXTSIZE);
		p5.handle3D = new Handle3D(p5, p5.handle3D.getIs3DMode()); // update 3D display vars, pass current 3D mode
		p5.loop();
	};

	p5.overCircle = (x: number, y: number, diameter: number) => {
		return p5.sqrt(p5.sq(x - p5.mouseX) + p5.sq(y - p5.mouseY)) < diameter / 2;
	};

	p5.mousePressed = () => {
		const config = get(ConfigStore);
		if (config.highlightToggle && !p5.handle3D.getIs3DModeOrTransitioning()) p5.gui.highlight.handleMousePressed();
		p5.loop();
	};

	p5.mouseReleased = () => {
		const config = get(ConfigStore);
		if (config.highlightToggle && !p5.handle3D.getIs3DModeOrTransitioning()) p5.gui.highlight.handleMouseRelease();
		p5.loop();
	};

	p5.saveCodeFile = () => {
		if (p5.dataIsLoaded(p5.floorPlan.getImg()) && p5.arrayIsLoaded(users)) {
			const setPathData = new SetPathData(p5);
			for (const user of users) {
				if (user.enabled) {
					const [startTimeArray, endTimeArray] = setPathData.getCodeFileArrays(user.dataTrail);
					const tableData = p5.writeTable(startTimeArray, endTimeArray);
					p5.saveTable(tableData, user.name, 'csv');
					break; // Save only the first enabled user
				}
			}
		}
	};

	p5.arrayIsLoaded = (data: any) => {
		return Array.isArray(data) && data.length;
	};

	p5.writeTable = (startTimesArray: any, endTimesArray: any) => {
		const headers = ['start', 'end'];
		const table = new p5.Table();
		table.addColumn(headers[0]);
		table.addColumn(headers[1]);
		for (let i = 0; i < startTimesArray.length; i++) {
			const newRow = table.addRow();
			newRow.setNum(headers[0], startTimesArray[i]);
			newRow.setNum(headers[1], endTimesArray[i]);
		}
		return table;
	};
};
