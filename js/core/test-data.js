class TestData {

    constructor() {
        //this.CSVHEADERS_MOVEMENT = ['time', 'x', 'y']; // String array indicating movement movement file headers, data in each column should be of type number or it won't process
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
    conversationResults(results) {
        return results.data.length > 1 && this.includesAllHeaders(results.meta.fields, this.CSVHEADERS_CONVERSATION) && this.conversationHasOneCleanRow(results.data);
    }

    includesAllHeaders(meta, headers) {
        for (const header of headers) {
            if (!meta.includes(header)) return false;
        }
        return true;
    }



    // Tests if current conversation row is less than total rows in table and if time is number and speaker is string and talk turn is not null or undefined
    conversationRowForType(parsedConversationArray, curRow) {
        return typeof parsedConversationArray[curRow][this.CSVHEADERS_CONVERSATION[0]] === 'number' && typeof parsedConversationArray[curRow][this.CSVHEADERS_CONVERSATION[1]] === 'string' && parsedConversationArray[curRow][this.CSVHEADERS_CONVERSATION[2]] != null;
    }

    /**
     * Tests if at least one row of correctly typed data in PapaParse data array
     * Returns true on first row of PapaParse data array that has all correctly typed data for conversation headers
     * @param  {PapaParse results.data []} data
     */
    conversationHasOneCleanRow(parsedConversationArray) {
        for (let i = 0; i < parsedConversationArray.length; i++) {
            if (this.conversationRowForType(parsedConversationArray, i)) return true;
        }
        return false;
    }
}