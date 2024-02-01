import { FloorPlanContainer } from './floorplan-container.js';
import { Highlight } from './highlight.js';

export class SketchGUI {
	constructor(sketch) {
		this.sk = sketch;
		this.displayBottom = this.sk.height;
		this.fpContainer = new FloorPlanContainer(this.sk, this.sk.sketchController.getTimelineStartXPos(), this.displayBottom);
		this.highlight = new Highlight(this.sk, this.displayBottom);
	}

	update2D() {
		if (this.sk.sketchController.overTimeline() && !this.sk.handle3D.getIs3DMode()) this.drawLongSlicer();

		if (!this.sk.handle3D.getIs3DModeOrTransitioning()) {
			if (this.sk.sketchController.getCurSelectTab() === 1) this.fpContainer.drawRegionSelector();
			else if (this.sk.sketchController.getCurSelectTab() === 2) this.fpContainer.drawSlicerSelector();
		}
	}

	update3D() {
		this.highlight.setDraw();
		if (this.sk.handle3D.getIs3DMode() && this.sk.sketchController.overTimeline()) {
			this.draw3DSlicerRect(this.fpContainer.getContainer(), this.sk.sketchController.mapToSelectTimeThenPixelTime(this.sk.mouseX));
		}
	}

	setSlicerStroke() {
		this.sk.fill(0);
		this.sk.stroke(0);
		this.sk.strokeWeight(2);
	}

	drawLongSlicer() {
		this.setSlicerStroke();
		this.sk.line(this.sk.mouseX, 0, this.sk.mouseX, this.displayBottom);
	}

	draw3DSlicerRect(container, zPos) {
		this.sk.fill(255, 50);
		this.sk.stroke(0);
		this.sk.strokeWeight(1);
		this.sk.quad(0, 0, zPos, container.width, 0, zPos, container.width, container.height, zPos, 0, container.height, zPos);
	}
}
