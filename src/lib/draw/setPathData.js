/**
 * This class prepares for drawing of all loaded movement and conversation data held in Path objects
 * Creates instances of DrawMovement and DrawConversation to handle different kinds of drawing methods for each type of data
 * DrawUtils holds helper methods used across DrawMovement and DrawConversation classes
 * CodeList is passed to DrawUtils for later use determining what pieces of data to draw
 */

import { DrawMovement } from './draw-movement.js';
import { DrawConversation } from './draw-conversation.js';
import { DrawUtils } from './draw-utils.js';

export class SetPathData {
	constructor(sketch) {
		this.sk = sketch;
		this.drawUtils = new DrawUtils(sketch);
	}

	setMovementAndConversation(userList) {
		const drawConversation = new DrawConversation(this.sk, this.drawUtils);
		const drawMovement = new DrawMovement(this.sk, this.drawUtils);

		for (const user of userList) {
			if (user.conversation_enabled) {
				drawConversation.setData(user);
			}
			if (user.enabled) {
				drawMovement.setData(user); // draw after conversation so dot displays on top
			}
		}
		drawConversation.setConversationBubble(); // draw conversation text last so it displays on top
	}

	getCodeFileArrays(dataTrail) {
		// Ensure the array has at least two elements
		if (dataTrail.length < 2) {
			console.error('dataTrail must contain at least two elements.');
			return [[], []];
		}

		let startTimesArray = [];
		let endTimesArray = [];
		let isRecordingCode = false;
		for (let i = 1; i < dataTrail.length; i++) {
			const point = dataTrail[i];
			const augmentedPoint = this.drawUtils.createAugmentPoint(this.sk.PLAN, point, point.time);
			if (this.drawUtils.isVisible(augmentedPoint.point, augmentedPoint.pos, augmentedPoint.point.stopLength)) {
				if (isRecordingCode === false) {
					isRecordingCode = true;
					startTimesArray.push(point.time);
				}
			} else {
				if (isRecordingCode === true) {
					isRecordingCode = false;
					endTimesArray.push(dataTrail[i - 1].time); // previous point time
				}
			}
			// For last point if still recording
			if (i === dataTrail.length - 1 && isRecordingCode === true) endTimesArray.push(point.time);
		}
		return [startTimesArray, endTimesArray];
	}
}
