class TestData {

    constructor() {
        this.headersMovement = ['time', 'x', 'y']; // String array indicating movement movement file headers, data in each column should be of type number or it won't process
        this.headersConversation = ['time', 'speaker', 'talk']; // String array indicating conversation file headers, data in time column shout be of type number, speaker column should be of type String, talk column should be not null or undefined
        this.headersCodes = ['start', 'end'];
        this.headersMultiCodes = ['code', 'start', 'end']; // multiCodeHeaders match headerCodes with one extra column 'code'
    }

    /**
     * @param  {Papaparse Results Array} results
     * @param  {Array} headers
     * @param  {Function} callbackTypeTest
     * Note: must bind this to callbackTypeTest to set correct "this" context
     */
    parsedResults(results, headers, callbackTypeTest) {
        return results.data.length > 0 && this.includesAllHeaders(results.meta.fields, headers) && this.hasOneCleanRow(results.data, callbackTypeTest.bind(this));
    }

    includesAllHeaders(meta, headers) {
        for (const header of headers) {
            if (!meta.includes(header)) return false;
        }
        return true;
    }

    hasOneCleanRow(resultsDataArray, callbackTypeTest) {
        for (const curRow of resultsDataArray) {
            if (callbackTypeTest(curRow)) return true;
        }
        return false;
    }

    movementRowForType(curRow) {
        return typeof curRow[this.headersMovement[0]] === 'number' && typeof curRow[this.headersMovement[1]] === 'number' && typeof curRow[this.headersMovement[2]] === 'number';
    }

    conversationRowForType(curRow) {
        return typeof curRow[this.headersConversation[0]] === 'number' && typeof curRow[this.headersConversation[1]] === 'string' && curRow[this.headersConversation[2]] != null;
    }

    codeRowForType(curRow) {
        return typeof curRow[this.headersCodes[0]] === 'number' && typeof curRow[this.headersCodes[1]] === 'number';
    }

    multiCodeRowForType(curRow) {
        return typeof curRow[this.headersMultiCodes[0]] === 'string' && typeof curRow[this.headersMultiCodes[1]] === 'number' && typeof curRow[this.headersMultiCodes[2]] === 'number';
    }

    curTimeIsLarger(curRow, priorRow) {
        return Number.parseFloat(curRow[this.headersMovement[0]]).toFixed(1) > Number.parseFloat(priorRow[this.headersMovement[0]]).toFixed(1);
    }

    movementTimeIsLarger(movementTime, curRow) {
        return movementTime >= curRow[this.headersConversation[0]];
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
    cleanFileName(string) {
        return string.charAt(0).toUpperCase();
    }
}