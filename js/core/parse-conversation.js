class ParseConversation {

    constructor(sketch, testData) {
        this.sk = sketch;
        this.testData = testData;
        this.parsedFileArray = []; // PapaParse results.data Array
    }

    processFile(results, file) {
        this.clear();
        this.parsedFileArray = results.data;
        this.sk.core.updateConversation(this.parsedFileArray);
    }


    getParsedFileArray() {
        return this.parsedFileArray;
    }

    clear() {
        this.parsedFileArray = [];
        this.sk.core.clearConversation();
    }
}