class TestData {

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
        return results.data.length > 1 && this.movementHeaders(results.meta.fields) && this.movementRowsForType(results.data);
    }

    /**
     * Test if results array has data, correct file headers, and at least one row of correctly typed data
     * @param  {PapaParse Results []} results
     */
    conversationResults(results) {
        return results.data.length > 1 && this.conversationHeaders(results.meta.fields) && this.conversationRowsForType(results.data);
    }

    /**
     * Tests if PapaParse meta results array includes correct headers for movement
     * @param  {PapaParse results.meta.fields} meta
     */
    movementHeaders(meta) {
        return meta.includes(CSVHEADERS_MOVEMENT[0]) && meta.includes(CSVHEADERS_MOVEMENT[1]) && meta.includes(CSVHEADERS_MOVEMENT[2]);
    }

    /**
     * Tests if PapaParse meta results array includes correct headers for conversation
     * @param  {PapaParse results.meta.fields} meta
     */
    conversationHeaders(meta) {
        return meta.includes(CSVHEADERS_CONVERSATION[0]) && meta.includes(CSVHEADERS_CONVERSATION[1]) && meta.includes(CSVHEADERS_CONVERSATION[2]);
    }

    /**
     * Returns true if all values in provided row are of number type
     * @param  {Results [] from PapaParse} data
     * @param  {Integer} curRow
     */
    movementRowForType(data, curRow) {
        return typeof data[curRow][CSVHEADERS_MOVEMENT[0]] === 'number' && typeof data[curRow][CSVHEADERS_MOVEMENT[1]] === 'number' && typeof data[curRow][CSVHEADERS_MOVEMENT[2]] === 'number';
    }

    /**
     * Tests if at least one row of correctly typed data in PapaParse data array
     * Returns true on first row of PapaParse data array that has all correctly typed data for movement headers
     * @param  {PapaParse results.data []} data
     */
    movementRowsForType(data) {
        for (let i = 0; i < data.length; i++) {
            if (typeof data[i][CSVHEADERS_MOVEMENT[0]] === 'number' && typeof data[i][CSVHEADERS_MOVEMENT[1]] === 'number' && typeof data[i][CSVHEADERS_MOVEMENT[2]] === 'number') return true;
        }
        return false;
    }

    /**
     * Tests if at least one row of correctly typed data in PapaParse data array
     * Returns true on first row of PapaParse data array that has all correctly typed data for conversation headers
     * @param  {PapaParse results.data []} data
     */
    conversationRowsForType(data) {
        for (let i = 0; i < data.length; i++) {
            if (typeof data[i][CSVHEADERS_CONVERSATION[0]] === 'number' && typeof data[i][CSVHEADERS_CONVERSATION[1]] === 'string' && data[i][CSVHEADERS_CONVERSATION[2]] != null) return true;
        }
        return false;
    }

    // Tests if current conversation row is less than total rows in table and if time is number and speaker is string and talk turn is not null or undefined
    // NOTE: this also tests if a conversation file is loaded
    conversationLengthAndRowForType(curRow) {
        return curRow < core.conversationFileResults.length && typeof core.conversationFileResults[curRow][CSVHEADERS_CONVERSATION[0]] === 'number' && typeof core.conversationFileResults[curRow][CSVHEADERS_CONVERSATION[1]] === 'string' && core.conversationFileResults[curRow][CSVHEADERS_CONVERSATION[2]] != null;
    }
    /**
     * Samples data based on comparing time and x/y positions of two points
     * @param  {PapaParse results[]} data
     * @param  {Number} curRow
     */
    sampleMovementData(data, curRow) {
        const posChange = 2; // number of pixels to compare change in x/y position
        if (curRow < 3) return true; // always return true for first two rows to set starting point
        else return (Number.parseFloat(data[curRow][CSVHEADERS_MOVEMENT[0]]).toFixed(1) > Number.parseFloat(data[curRow - 1][CSVHEADERS_MOVEMENT[0]]).toFixed(1)) || (Math.abs(Math.floor(data[curRow][CSVHEADERS_MOVEMENT[1]]) - Math.floor(data[curRow - 1][CSVHEADERS_MOVEMENT[1]])) > posChange) || (Math.abs(Math.floor(data[curRow][CSVHEADERS_MOVEMENT[2]]) - Math.floor(data[curRow - 1][CSVHEADERS_MOVEMENT[2]])) > posChange);
    }
}