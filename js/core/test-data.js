class TestData {

    constructor() {
        this.CSVHEADERS_MOVEMENT = ['time', 'x', 'y']; // String array indicating movement movement file headers, data in each column should be of type number or it won't process
        this.CSVHEADERS_CONVERSATION = ['time', 'speaker', 'talk']; // String array indicating conversation file headers, data in time column shout be of type number, speaker column should be of type String, talk column should be not null or undefined
    }

    /**
     * Returns false if parameter is undefined or null
     * @param  {Any Type} data
     */
    dataIsLoaded(data) {
        return data != null; // in javascript this tests for both undefined and null values
    }

    /**
     * Tests if parameter is an array with length
     * @param  {Any Type} data
     */
    arrayIsLoaded(data) {
        return Array.isArray(data) && data.length;
    }

    /**
     * Test if results array has data, correct file headers, and at least one row of correctly typed data
     * @param  {PapaParse Results []} results
     */
    movementResults(results) {
        return results.data.length > 1 && this.includesAllHeaders(results.meta.fields, this.CSVHEADERS_MOVEMENT) && this.movementRowsForType(results.data);
    }

    /**
     * Test if results array has data, correct file headers, and at least one row of correctly typed data
     * @param  {PapaParse Results []} results
     */
    conversationResults(results) {
        return results.data.length > 1 && this.includesAllHeaders(results.meta.fields, this.CSVHEADERS_CONVERSATION) && this.conversationRowsForType(results.data);
    }

    includesAllHeaders(meta, headers) {
        for (const header of headers) {
            if (!meta.includes(header)) return false;
        }
        return true;
    }

    /**
     * Returns true if all values in provided row are of number type
     * @param  {Results [] from PapaParse} data
     * @param  {Integer} curRow
     */
    movementRowForType(parsedMovementArray, curRow) {
        return typeof parsedMovementArray[curRow][this.CSVHEADERS_MOVEMENT[0]] === 'number' && typeof parsedMovementArray[curRow][this.CSVHEADERS_MOVEMENT[1]] === 'number' && typeof parsedMovementArray[curRow][this.CSVHEADERS_MOVEMENT[2]] === 'number';
    }

    /**
     * Tests if at least one row of correctly typed data in PapaParse data array
     * Returns true on first row of PapaParse data array that has all correctly typed data for movement headers
     * @param  {PapaParse results.data []} data
     */
    movementRowsForType(parsedMovementArray) {
        for (const row of parsedMovementArray) {
            if (typeof row[this.CSVHEADERS_MOVEMENT[0]] === 'number' && typeof row[this.CSVHEADERS_MOVEMENT[1]] === 'number' && typeof row[this.CSVHEADERS_MOVEMENT[2]] === 'number') return true;
        }
        return false;
    }

    /**
     * Tests if at least one row of correctly typed data in PapaParse data array
     * Returns true on first row of PapaParse data array that has all correctly typed data for conversation headers
     * @param  {PapaParse results.data []} data
     */
    conversationRowsForType(parsedConversationArray) {
        for (const row of parsedConversationArray) {
            if (typeof row[this.CSVHEADERS_CONVERSATION[0]] === 'number' && typeof row[this.CSVHEADERS_CONVERSATION[1]] === 'string' && row[this.CSVHEADERS_CONVERSATION[2]] != null) return true;
        }
        return false;
    }

    // Tests if current conversation row is less than total rows in table and if time is number and speaker is string and talk turn is not null or undefined
    conversationLengthAndRowForType(parsedConversationArray, curRow) {
        return curRow < parsedConversationArray.length && typeof parsedConversationArray[curRow][this.CSVHEADERS_CONVERSATION[0]] === 'number' && typeof parsedConversationArray[curRow][this.CSVHEADERS_CONVERSATION[1]] === 'string' && parsedConversationArray[curRow][this.CSVHEADERS_CONVERSATION[2]] != null;
    }
    /**
     * Samples data based on comparing time and x/y positions of two points
     * @param  {PapaParse results[]} data
     * @param  {Number} curRow
     */
    sampleMovementData(parsedMovementArray, curRow) {
        const posChange = 2; // number of pixels to compare change in x/y position
        if (curRow < 3) return true; // always return true for first two rows to set starting point
        else return (Number.parseFloat(parsedMovementArray[curRow][this.CSVHEADERS_MOVEMENT[0]]).toFixed(1) > Number.parseFloat(parsedMovementArray[curRow - 1][this.CSVHEADERS_MOVEMENT[0]]).toFixed(1)) || (Math.abs(Math.floor(parsedMovementArray[curRow][this.CSVHEADERS_MOVEMENT[1]]) - Math.floor(parsedMovementArray[curRow - 1][this.CSVHEADERS_MOVEMENT[1]])) > posChange) || (Math.abs(Math.floor(parsedMovementArray[curRow][this.CSVHEADERS_MOVEMENT[2]]) - Math.floor(parsedMovementArray[curRow - 1][this.CSVHEADERS_MOVEMENT[2]])) > posChange);
    }
}