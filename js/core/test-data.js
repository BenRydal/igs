class TestData {

    constructor() {
        this.headersMovement = ['time', 'x', 'y']; // String array indicating movement movement file headers, data in each column should be of type number or it won't process
        this.headersConversation = ['time', 'speaker', 'talk']; // String array indicating conversation file headers, data in time column shout be of type number, speaker column should be of type String, talk column should be not null or undefined
    }

    /**
     * @param  {PapaParse Results []} results
     */
    testParsedMovementResults(results) {
        return results.data.length > 1 && this.includesAllHeaders(results.meta.fields, this.headersMovement) && this.movementHasOneCleanRow(results.data);
    }

    testParsedConversationResults(results) {
        return results.data.length > 1 && this.includesAllHeaders(results.meta.fields, this.headersConversation) && this.conversationHasOneCleanRow(results.data);
    }

    includesAllHeaders(meta, headers) {
        for (const header of headers) {
            if (!meta.includes(header)) return false;
        }
        return true;
    }

    movementHasOneCleanRow(parsedMovementArray) {
        for (const curRow of parsedMovementArray) {
            if (this.movementRowForType(curRow)) return true;
        }
        return false;
    }

    movementRowForType(curRow) {
        return typeof curRow[this.headersMovement[0]] === 'number' && typeof curRow[this.headersMovement[1]] === 'number' && typeof curRow[this.headersMovement[2]] === 'number';
    }

    conversationHasOneCleanRow(parsedConversationArray) {
        for (const curRow of parsedConversationArray) {
            if (this.conversationRowForType(curRow)) return true;
        }
        return false;
    }

    conversationRowForType(curRow) {
        return typeof curRow[this.headersConversation[0]] === 'number' && typeof curRow[this.headersConversation[1]] === 'string' && curRow[this.headersConversation[2]] != null;
    }

    compareTimes(rows) {
        return Number.parseFloat(rows.curRow[this.headersMovement[0]]).toFixed(1) > Number.parseFloat(rows.priorRow[this.headersMovement[0]]).toFixed(1);
    }

    isStopped(curRow, movementPointArray) {
        if (movementPointArray.length === 0) return true; // if it has not been filled, return true for isStopped value
        else return this.pointsHaveSamePosition(curRow, movementPointArray[movementPointArray.length - 1]);
    }

    pointsHaveSamePosition(curRow, lastMovementPoint) {
        return curRow[this.headersMovement[1]] === lastMovementPoint.xPos && curRow[this.headersMovement[2]] === lastMovementPoint.yPos;
    }

    /**
     * Used to compare and add new speakers to speakerList
     * @param  {String} s
     */
    cleanSpeaker(string) {
        return string.trim().toUpperCase().substring(0, 2);
    }

    /**
     * Used to compare and add new paths to pathList
     * NOTE: this may need to match cleanSpeaker in the future
     * @param  {String} s
     */
    cleanPathName(string) {
        return string.charAt(0).toUpperCase();
    }
}