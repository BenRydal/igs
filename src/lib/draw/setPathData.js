/**
 * This class prepares for drawing of all loaded movement and conversation data held in Path objects
 * Creates instances of DrawMovement and DrawConversation to handle different kinds of drawing methods for each type of data
 * DrawUtils holds helper methods used across DrawMovement and DrawConversation classes
 * CodeList is passed to DrawUtils for later use determining what pieces of data to draw
 */

import { DrawMovement } from './draw-movement.js';
import { DrawConversation } from './draw-conversation.js';
import { DrawUtils } from './draw-utils.js';
import { CreateCodeFile } from './create-code-file.js';

export class SetPathData {

    constructor(sketch, codeList) {
        this.sk = sketch;
        this.drawUtils = new DrawUtils(sketch, codeList);
    }

    setMovement(users) {
        const drawMovement = new DrawMovement(this.sk, this.drawUtils);
        for (const user of users) {
            if (user.enabled) drawMovement.setData(user);
        }
        // for (const path of dataTrail) {
        //     if (path.isShowing) drawMovement.setData(path);
        // }
    }

    // setMovement(pathList) {
    //     const drawMovement = new DrawMovement(this.sk, this.drawUtils);
    //     for (const path of pathList) {
    //         if (path.isShowing) drawMovement.setData(path);
    //     }
    // }

    // setMovementAndConversation(pathList, speakerList) {
    //     const drawConversation = new DrawConversation(this.sk, this.drawUtils);
    //     const drawMovement = new DrawMovement(this.sk, this.drawUtils);
    //     for (const path of pathList) {
    //         if (path.isShowing) {
    //             drawConversation.setData(path, speakerList);
    //             drawMovement.setData(path); // draw after conversation so dot displays on top
    //         }
    //     }
    //     drawConversation.setConversationBubble(); // draw conversation text last so it displays on top
    // }
    setMovementAndConversation(userList) {
        const drawConversation = new DrawConversation(this.sk, this.drawUtils);
        const drawMovement = new DrawMovement(this.sk, this.drawUtils);
        for (const user of userList) {
            if (user.enabled) {
                // drawConversation.setData(user);
                drawMovement.setData(user); // draw after conversation so dot displays on top
            }
        }
        drawConversation.setConversationBubble(); // draw conversation text last so it displays on top
    }

    // Prepares a code file for all selected data for every path showing in GUI
    setCodeFile(pathList) {
        const createCodeFile = new CreateCodeFile(this.sk, this.drawUtils);
        for (const path of pathList) {
            if (path.isShowing) createCodeFile.create(path);
        }
    }
}