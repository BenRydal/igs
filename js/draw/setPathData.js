/**
 * This class prepares for drawing of all loaded movement and conversation data held in Path objects
 * Creates instances of DrawMovement and DrawConversation to handle different kinds of drawing methods for each type of data
 * DrawUtils holds helper methods used across DrawMovement and DrawConversation classes
 * Core data are passed to this class.
 */

import {
    DrawMovement
} from './draw-movement.js';
import {
    DrawConversation
} from './draw-conversation.js';
import {
    DrawUtils
} from './draw-utils.js';

export class SetPathData {

    constructor(sketch, pathList, speakerList, codeList) {
        this.sk = sketch;
        this.pathList = pathList;
        this.speakerList = speakerList;
        this.codeList = codeList;
        this.drawUtils = new DrawUtils(sketch, codeList);
    }

    set() {
        if (this.sk.arrayIsLoaded(this.pathList)) {
            if (this.sk.arrayIsLoaded(this.speakerList)) this.setMovementAndConversation();
            else this.setMovement();
        }
    }

    setMovement() {
        const drawMovement = new DrawMovement(this.sk, this.drawUtils);
        for (const path of this.pathList) {
            if (path.isShowing) drawMovement.setData(path);
        }
    }

    setMovementAndConversation() {
        const drawConversation = new DrawConversation(this.sk, this.drawUtils);
        const drawMovement = new DrawMovement(this.sk, this.drawUtils);
        for (const path of this.pathList) {
            if (path.isShowing) {
                drawConversation.setData(path, this.speakerList);
                drawMovement.setData(path); // draw after conversation so dot displays on top
            }
        }
        drawConversation.setConversationBubble(); // draw conversation text last so it displays on top
    }
}