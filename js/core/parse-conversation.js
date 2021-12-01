class ParseConversation {

    constructor(sketch, testData) {
        this.sk = sketch;
        this.testData = testData;
        this.parsedFileArray = []; // PapaParse results.data Array
    }

    processFile(results, file) {
        if (this.testData.parsedResults(results, this.testData.headersConversation, this.testData.conversationRowForType)) {
            this.clear();
            this.parsedFileArray = results.data;
            this.sk.core.updateConversation(this.parsedFileArray);
        } else alert("Error loading conversation file. Please make sure your file is a .CSV file formatted with column headers: " + this.testData.headersConversation.toString());
    }


    getParsedFileArray() {
        return this.parsedFileArray;
    }

    clear() {
        this.parsedFileArray = [];
        this.sk.core.clearConversation();
    }
}