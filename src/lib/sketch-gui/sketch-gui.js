import { TimelinePanel } from './timeline-panel.js';
import { FloorPlanContainer } from './floorplan-container.js';
import { Highlight } from './highlight.js';

export class SketchGUI {
	constructor(sketch) {
		this.sk = sketch;
		this.displayBottom = this.sk.height;
		this.timelinePanel = new TimelinePanel(this.sk);
		this.fpContainer = new FloorPlanContainer(this.sk, this.timelinePanel.getStart(), this.displayBottom);
		this.highlight = new Highlight(this.sk, this.displayBottom);
	}

	update2D() {
		if (this.timelinePanel.overTimeline() && !this.sk.handle3D.getIs3DMode()) this.timelinePanel.drawLongSlicer();

		if (!this.sk.handle3D.getIs3DModeOrTransitioning()) {
			if (this.sk.sketchController.getCurSelectTab() === 1) this.fpContainer.drawRegionSelector();
			else if (this.sk.sketchController.getCurSelectTab() === 2) this.fpContainer.drawSlicerSelector();
		}
	}

	update3D() {
		this.highlight.setDraw();
		if (this.sk.handle3D.getIs3DMode() && this.timelinePanel.overTimeline()) {
			this.timelinePanel.draw3DSlicerRect(this.fpContainer.getContainer(), this.sk.sketchController.mapToSelectTimeThenPixelTime(this.sk.mouseX));
		}
	}
}
