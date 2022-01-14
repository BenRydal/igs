class TestData {

    constructor() {
        // NOTE: All headers must be lowercase as input data tables are converted to lowercase when loaded using PapaParse transformHeaders method
        this.headersMovement = ['time', 'x', 'y']; // Each index is tested to be type number
        this.headersConversation = ['time', 'speaker', 'talk']; // Of type number, string, and not null or undefined
        this.headersSingleCodes = ['start', 'end']; // Of type number
        this.headersMultiCodes = ['code', 'start', 'end']; // matches singleCodeHeaders with one extra column 'code' of type string
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

    // NOTE: fieldNames from parsed file are converted to lowercase on Processing with PapaParse transformHeaders method
    includesAllHeaders(fieldNamesLowerCase, headers) {
        for (const header of headers) {
            if (!fieldNamesLowerCase.includes(header)) return false;
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
        return typeof curRow[this.headersSingleCodes[0]] === 'number' && typeof curRow[this.headersSingleCodes[1]] === 'number';
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
     * Used to compare and add new data to core data lists from CSV file names and data
     * @param  {String} s
     */
    cleanFileName(string) {
        return string.trim().replace(/\.[^/.]+$/, "").toLowerCase();
    }
}