class ParseConversation {

    constructor(sketch, testData) {
        this.sk = sketch;
        this.testData = testData;
        this.parsedFileArray = []; // PapaParse results.data Array
    }

    /**
     * This method is important for binding this to callback
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
            this.parseFile(file, this.processFile.bind(this)); // parse file after retrieval, maintain correct this context on callback with bind
        } catch (error) {
            alert("Error loading example conversation data. Please make sure you have a good internet connection")
            console.log(error);
        }
    }

    /**
     * Parses file and sends for further testing / processing
     * @param  {CSV File} file
     */
    parseFile(file, callback) {
        Papa.parse(file, {
            complete: (results, originalFile) => callback(results, originalFile),
            error: (error, originalFile) => {
                alert("Parsing error with your conversation file. Please make sure your file is formatted correctly as a .CSV");
                console.log(error, originalFile);
            },
            header: true,
            dynamicTyping: true,
        });
    }

    processFile(results, file) {
        console.log("Parsing complete:", results, file);
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