export class ParseMovement {

    constructor(sketch, coreUtils) {
        this.sk = sketch;
        this.coreUtils = coreUtils;
        this.parsedFileArray = []; // Holds PapaParse results.data array and string name of path for each processed file
    }

    /**
     * Adds new data to parsedFileArray and program data
     * @param  {Papaparse results Array} results
     * @param  {File} file
     */
    processFile(results, file) {
        const stringName = this.coreUtils.cleanFileName(file.name);
        this.parsedFileArray.push({
            parsedMovementArray: results.data,
            stringName
        });
        this.processPointArrays(results.data, stringName);
    }

    processPointArrays(resultsDataArray, stringName) {
        const [movementPointArray, conversationPointArray] = this.createPointArrays(resultsDataArray, this.sk.core.parseConversation.getParsedFileArray());
        this.sk.core.updateMovement(stringName, movementPointArray, conversationPointArray);
    }

    reProcessAllPointArrays() {
        for (const index of this.parsedFileArray) {
            this.processPointArrays(index.parsedMovementArray, index.stringName);
        }
    }

    /**
     * Returns clean arrays of MovementPoint and ConversationPoint objects
     * ConversationPoint attributes draw from MovementPoint with first time value that is larger that time value at current conversation row in table
     * NOTE: conversationCounter is used/updated to efficiently manage joining of movement/conversationPoint attributes
     * TODO: consider how best to implement movement/curTimeLarger tests in the future
     * @param  {PapaParse results.data Array} parsedMovementArray
     * @param  {PapaParse results.data Array} parsedConversationArray
     */
    createPointArrays(parsedMovementArray, parsedConversationArray) {
        let movementPointArray = [];
        let conversationPointArray = [];
        let conversationCounter = 0; // Current row count of conversation file for comparison
        for (let i = 1; i < parsedMovementArray.length; i++) {
            const curRow = parsedMovementArray[i];
            const priorRow = parsedMovementArray[i - 1];
            if (this.coreUtils.movementRowForType(curRow) && this.coreUtils.curTimeIsLarger(curRow, priorRow)) {
                const m = this.createMovementPoint(curRow, movementPointArray);
                movementPointArray.push(m);
                if (conversationCounter < parsedConversationArray.length) { // this test both makes sure conversationArray is loaded and counter is not great than length
                    const curConversationRow = parsedConversationArray[conversationCounter];
                    if (this.coreUtils.conversationRowForType(curConversationRow) && this.coreUtils.movementTimeIsLarger(m.time, curConversationRow)) {
                        conversationPointArray.push(this.createConversationPoint(m, curConversationRow));
                        conversationCounter++;
                    } else if (!this.coreUtils.conversationRowForType(curConversationRow)) conversationCounter++; // make sure to increment counter if bad data to skip row in next iteration of loop
                }
            }
        }
        return [movementPointArray, conversationPointArray];
    }

    /**
     * Represents a location in space and time along a path with other attributes
     */
    createMovementPoint(curRow, movementPointArray) {
        return {
            time: curRow[this.coreUtils.headersMovement[0]],
            xPos: curRow[this.coreUtils.headersMovement[1]],
            yPos: curRow[this.coreUtils.headersMovement[2]],
            isStopped: this.coreUtils.isStopped(curRow, movementPointArray),
            codes: this.sk.core.parseCodes.getCodeData(curRow[this.coreUtils.headersMovement[0]])
        }
    }

    /**
     * Represents a single conversation turn with a location in space and time
     * NOTE: Movement Point attributes are passed to create some attributes for a Conversation Point
     */
    createConversationPoint(movementPoint, curConversationRow) {
        return {
            time: movementPoint.time,
            xPos: movementPoint.xPos,
            yPos: movementPoint.yPos,
            isStopped: movementPoint.isStopped,
            codes: movementPoint.codes,
            speaker: this.coreUtils.cleanFileName(curConversationRow[this.coreUtils.headersConversation[1]]), // String name of speaker
            talkTurn: String(curConversationRow[this.coreUtils.headersConversation[2]]) // Cast to String to treat numbers or booleans as Strings
        }
    }

    clear() {
        this.parsedFileArray = [];
        this.sk.core.clearMovement();
    }
}