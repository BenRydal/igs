import { FloorPlanContainer } from './floorplan-container.js';
import { Highlight } from './highlight.js';
import TimelineStore from '../../stores/timelineStore';
import ConfigStore from '../../stores/configStore';
import { get } from 'svelte/store';

let timeline;

TimelineStore.subscribe((data) => {
	timeline = data;
});

export class SketchGUI {
	constructor(sketch) {
		this.sk = sketch;
		this.displayBottom = this.sk.height;
		this.fpContainer = new FloorPlanContainer(this.sk, timeline.getLeftX(), this.displayBottom);
		this.highlight = new Highlight(this.sk, this.displayBottom);
	}

	update2D() {
		const config = get(ConfigStore);
		if (timeline.overTimeline(this.sk.mouseX) && !this.sk.handle3D.getIs3DMode()) this.drawLongSlicer();

		if (!this.sk.handle3D.getIs3DModeOrTransitioning()) {
			if (config.circleToggle) this.fpContainer.drawRegionSelector();
			else if (config.sliceToggle) this.fpContainer.drawSlicerSelector();
		}
	}

	update3D() {
		this.highlight.setDraw();
		if (this.sk.handle3D.getIs3DMode() && timeline.overTimeline(this.sk.mouseX)) {
			this.draw3DSlicerRect(this.fpContainer.getContainer(), this.sk.mapToSelectTimeThenPixelTime(this.sk.mouseX));
		}
	}

	setSlicerStroke() {
		this.sk.fill(0);
		this.sk.stroke(0);
		this.sk.strokeWeight(1); // Thinner line for more professional look
	}

	drawLongSlicer() {
		// Draw a subtle shadow first
		this.sk.stroke(0, 30);
		this.sk.strokeWeight(3);
		this.sk.line(this.sk.mouseX + 1, -10, this.sk.mouseX + 1, this.displayBottom + 10);

		// Draw the main line
		this.setSlicerStroke();
		this.sk.line(this.sk.mouseX, -10, this.sk.mouseX, this.displayBottom + 10);
	}

	draw3DSlicerRect(container, zPos) {
		this.sk.fill(255, 50);
		this.sk.stroke(0);
		this.sk.strokeWeight(1);
		this.sk.quad(0, 0, zPos, container.width, 0, zPos, container.width, container.height, zPos, 0, container.height, zPos);
	}
}
