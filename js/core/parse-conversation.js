class ParseConversation {

    constructor(sketch, testData) {
        this.sk = sketch;
        this.testData = testData; // holds various data tests for parsing and processing
        this.parsedFileArray = []; // List that holds results.data array from Papa Parsed CSV file
    }

    /**
     * Prepare for parsing. Important for binding this to callback
     * @param  {.CSV File} file
     */
    prepFile(file) {
        this.parseFile(file, this.processFile.bind(this));
    }

    /**
     * Handles async loading of conversation file. 
     * NOTE: folder and filename are separated for convenience later in program
     * @param  {String} folder
     * @param  {String} fileName
     */
    async prepExampleFile(folder, fileName) {
        try {
            const response = await fetch(new Request(folder + fileName));
            const buffer = await response.arrayBuffer();
            const file = new File([buffer], fileName, {
                type: "text/csv",
            });
            // parse file after retrieval, maintain correct this context on callback with bind
            this.parseFile(file, this.processFile.bind(this));
        } catch (error) {
            alert("Error loading example conversation data. Please make sure you have a good internet connection")
            console.log(error);
        }
    }

    /**
     * @param  {CSV File} file
     */
    parseFile(file, callback) {
        Papa.parse(file, {
            complete: (results, parsedFile) => callback(results, parsedFile),
            error: (error, parsedFile) => {
                alert("Parsing error with your conversation file. Please make sure your file is formatted correctly as a .CSV");
                console.log(error, parsedFile);
            },
            header: true,
            dynamicTyping: true,
        });
    }

    processFile(results, file) {
        console.log("Parsing complete:", results, file);
        if (this.testData.parsedResults(results, this.testData.headersConversation, this.testData.conversationRowForType)) {
            this.clear();
            this.parsedFileArray = results.data; // set to new array of keyed values
            this.sk.core.updateConversationData();
        } else alert("Error loading conversation file. Please make sure your file is a .CSV file formatted with column headers: " + this.testData.headersConversation.toString());
    }

    getParsedConversationArray() {
        return this.parsedFileArray;
    }

    clear() {
        this.parsedFileArray = [];
        this.sk.core.clearConversationData();
    }
}