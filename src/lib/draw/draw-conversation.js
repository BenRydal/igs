import ConfigStore from '../../stores/configStore';
import TimelineStore from '../../stores/timelineStore';

let timeline;

TimelineStore.subscribe((data) => {
	timeline = data;
});

/**
 * This class holds drawing methods specific to drawing conversation rectangles and text depending on user interaction
 */

let stopSliderValue, isAllTalk, isAlignTalk;

ConfigStore.subscribe((data) => {
	stopSliderValue = data.stopSliderValue;
	isAllTalk = data.isAllTalk;
	isAlignTalk = data.isAlignTalk;
});

export class DrawConversation {
	constructor(sketch, drawUtils) {
		this.sk = sketch;
		this.drawUtils = drawUtils;
		this.rectPixelWidth = timeline.getCurConversationRectWidth(); // width needs to be dynamically updated when new data is loaded and timeline scaling is changed by user
		this.conversationBubble = {
			// represents user selected conversation
			isSelected: false,
			point: null, // stores one ConversationPoint object for selected conversation turn
			view: this.sk.PLAN // view indicating if user selected conversation in floor plan or space-time views
		};
	}

	setData(user) {
		const dataTrail = user.dataTrail;
		for (let i = 1; i < dataTrail.length; i++) {
			const point = dataTrail[i];
			if (point.speech !== '') {
				// TODO: Fix the true boolean to reflect what needs to happen here
				const curPos = this.drawUtils.getScaledConversationPos(point);
				if (this.drawUtils.isVisible(point, curPos, this.isStopped(point.stopLength))) {
					if (this.sk.sketchController.getIsPathColorMode()) this.organizeRectDrawing(point, curPos, user.color);
					else this.organizeRectDrawing(point, curPos, 'red');
				}
			}
		}
	}

	isStopped(stopLength) {
		return stopLength >= stopSliderValue;
	}

	/**
	 * Draws single textbox for user selected conversation
	 * NOTE: Must be translated 1 pixel to show text above all other visual elements with WEBGL renderer
	 */
	setConversationBubble() {
		if (this.conversationBubble.isSelected) {
			this.sk.push();
			this.sk.translate(0, 0, 1);
			this.drawTextBox(this.conversationBubble.point);
			this.sk.pop();
		}
	}

	/**
	 * Organizes drawing of properly scaled and colored rectangles for conversation turn of a ConversationPoint
	 * @param  {ConversationPoint} point
	 * @param  {curPos} curPos
	 * @param  {Color} curColor
	 */
	organizeRectDrawing(point, curPos, curColor) {
		this.sk.noStroke(); // reset if recordConversationBubble is called previously over2DRects
		this.sk.fill(curColor);
		if (this.sk.handle3D.getIs3DMode()) {
			this.drawFloorPlan3DRects(curPos);
			this.drawSpaceTime3DRects(curPos);
		} else {
			this.over2DRects(point, curPos);
			this.drawFloorPlan2DRects(curPos);
			this.drawSpaceTime2DRects(curPos);
		}
	}

	/**
	 * NOTE: if recordConversationBubble is called, that method also sets new strokeWeight to highlight the curRect
	 */
	over2DRects(point, curPos) {
		if (this.sk.overRect(curPos.floorPlanXPos, curPos.adjustYPos, this.rectPixelWidth, curPos.rectLength))
			this.recordConversationBubble(point.speech, this.sk.PLAN);
		else if (this.sk.overRect(curPos.selTimelineXPos, curPos.adjustYPos, this.rectPixelWidth, curPos.rectLength))
			this.recordConversationBubble(point.speech, this.sk.SPACETIME);
	}
	/**
	 * 2D and 3D floorplan rect drawing differs in the value of adjustYPos and positive/negative value of width/height parameters
	 */
	drawFloorPlan2DRects(curPos) {
		this.sk.rect(curPos.floorPlanXPos, curPos.adjustYPos, this.rectPixelWidth, curPos.rectLength);
	}

	drawFloorPlan3DRects(curPos) {
		this.sk.rect(curPos.floorPlanXPos, curPos.adjustYPos, -this.rectPixelWidth, -curPos.rectLength);
	}

	/**
	 * 2D and 3D Spacetime rect drawing differs in drawing of rect or quad shapes and zoom parameter
	 */
	drawSpaceTime2DRects(curPos) {
		this.sk.rect(curPos.selTimelineXPos, curPos.adjustYPos, this.rectPixelWidth, curPos.rectLength);
	}

	drawSpaceTime3DRects(curPos) {
		const translateZoom = Math.abs(this.sk.handle3D.getCurTranslatePos().zoom);
		if (isAlignTalk)
			this.sk.quad(
				0,
				translateZoom,
				curPos.selTimelineXPos,
				curPos.rectLength,
				translateZoom,
				curPos.selTimelineXPos,
				curPos.rectLength,
				translateZoom,
				curPos.selTimelineXPos + this.rectPixelWidth,
				0,
				translateZoom,
				curPos.selTimelineXPos + this.rectPixelWidth
			);
		else
			this.sk.quad(
				curPos.floorPlanXPos,
				curPos.adjustYPos,
				curPos.selTimelineXPos,
				curPos.floorPlanXPos + curPos.rectLength,
				curPos.adjustYPos,
				curPos.selTimelineXPos,
				curPos.floorPlanXPos + curPos.rectLength,
				curPos.adjustYPos,
				curPos.selTimelineXPos + this.rectPixelWidth,
				curPos.floorPlanXPos,
				curPos.adjustYPos,
				curPos.selTimelineXPos + this.rectPixelWidth
			);
	}

	/**
	 * Records user selected conversation
	 * NOTE: Also sets this.sk.stroke/strokeweight to highlight selected rectangle in drawRects method
	 * @param  {ConversationPoint} pointToDraw
	 * @param  {Integer} view
	 */
	recordConversationBubble(pointToDraw, view) {
		this.conversationBubble.isSelected = true;
		this.conversationBubble.point = pointToDraw;
		this.conversationBubble.view = view;
		this.sk.stroke(0);
		this.sk.strokeWeight(4);
	}

	/**
	 * Draws textbox and cartoon "bubble" for user selected conversation
	 * Sets box dimensions based on size of conversation turn/text
	 */
	drawTextBox(point) {
		const textBox = this.addTextBoxParams(this.getTextBoxParams(), point.talkTurn);
		this.sk.stroke(0);
		this.sk.strokeWeight(1);
		this.sk.fill(255, 200);
		this.sk.rect(
			textBox.xPos - textBox.boxSpacing,
			textBox.adjustYPos - textBox.boxSpacing,
			textBox.width + 2 * textBox.boxSpacing,
			textBox.height + 2 * textBox.boxSpacing
		);
		// Draw Text
		this.sk.fill(0);
		this.sk.text(point, textBox.xPos, textBox.adjustYPos, textBox.width, textBox.height);
		//this.sk.text(point.speaker + ": " + point.talkTurn, textBox.xPos, textBox.adjustYPos, textBox.width, textBox.height);
		// Cartoon bubble lines
		this.sk.stroke(255);
		this.sk.strokeWeight(2);
		this.sk.line(
			this.sk.mouseX - textBox.rectSpacing,
			textBox.adjustYPos + textBox.yDif,
			this.sk.mouseX - textBox.rectSpacing / 2,
			textBox.adjustYPos + textBox.yDif
		); // white line to hide black rect under cartoon bubble
		this.sk.stroke(0);
		this.sk.strokeWeight(1);
		this.sk.line(this.sk.mouseX, this.sk.mouseY, this.sk.mouseX - textBox.rectSpacing, textBox.adjustYPos + textBox.yDif);
		this.sk.line(this.sk.mouseX, this.sk.mouseY, this.sk.mouseX - textBox.rectSpacing / 2, textBox.adjustYPos + textBox.yDif);
	}

	getTextBoxParams() {
		return {
			width: this.sk.width / 3,
			textLeading: this.sk.width / 57,
			boxSpacing: this.sk.width / 141, // general textBox spacing variable
			rectSpacing: this.sk.width / 28.2 // distance from text rectangle of textbox
		};
	}

	addTextBoxParams(textBox, talkTurn) {
		textBox.height = textBox.textLeading * Math.ceil(this.sk.textWidth(talkTurn) / textBox.width);
		textBox.xPos = this.sk.constrain(this.sk.mouseX - textBox.width / 2, textBox.boxSpacing, this.sk.width - textBox.width - 2 * textBox.boxSpacing);
		if (this.sk.mouseY < this.sk.height / 2) {
			//if top half of screen, text box below rectangle
			textBox.adjustYPos = this.sk.mouseY + textBox.rectSpacing;
			textBox.yDif = -textBox.boxSpacing;
		} else {
			//if bottom half of screen, text box above rectangle
			textBox.adjustYPos = this.sk.mouseY - textBox.rectSpacing - textBox.height;
			textBox.yDif = textBox.height + textBox.boxSpacing;
		}
		return textBox;
	}

	/**
	 * Tests whether to draw selected speaker
	 * Speaker must be showing and either program on all talk mode or speaker matches pathname
	 * @param  {Char} speaker
	 * @param  {Char} pathName
	 */
	testSpeakerToDraw(speaker, pathName) {
		return speaker != null && speaker.isShowing && (isAllTalk || speaker.name === pathName);
	}

	/**
	 * Returns speaker object based from global speaker list if it matches passed character paramater
	 * Returns null if no match found
	 * @param  {Char} curSpeaker
	 */
	getSpeakerFromSpeakerList(curSpeaker, speakerList) {
		for (const speaker of speakerList) {
			if (speaker.name === curSpeaker) return speaker;
		}
		return null;
	}

	/**
	 *
	 * @param  {String} talkTurn
	 */
	isTalkTurnSelected(talkTurn) {
		const wordToSearch = this.sk.sketchController.getWordToSearch();
		if (!wordToSearch) return true; // Always return true if empty/no value
		else {
			const escape = wordToSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
			if (wordToSearch.length === 1) return new RegExp(escape, 'i').test(talkTurn); // case insensitive regex test
			else return new RegExp('\\b' + escape + '\\b', 'i').test(talkTurn); // \\b for whole word test
		}
	}
}
