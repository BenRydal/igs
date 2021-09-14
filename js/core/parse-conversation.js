class ParseConversation {

    constructor(sketch) {
        this.sk = sketch;
        //this.headers = ['time', 'speaker', 'talk'];
        this.parsedArray = []; // List that holds objects containing a parsed results.data array and character letter indicating path name from Papa Parsed CSV file
    }

    /**
     * Prepare for parsing. Important for binding this to callback
     * @param  {.CSV File} file
     */
    prepFile(file) {
        this.parseFile(file, this.processFile.bind(this));
    }

    /**
     * Handles async loading of conversation file. NOTE: folder and filename are separated for convenience later in program
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
     * Parse input files and send to processData method
     * @param  {.CSV File} file
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
        if (this.sk.testData.conversationResults(results)) {
            this.clear();
            this.parsedArray = results.data; // set to new array of keyed values
            this.sk.core.updateConversationData();
        } else alert("Error loading conversation file. Please make sure your file is a .CSV file formatted with column headers: " + this.sk.testData.CSVHEADERS_CONVERSATION.toString());
    }

    getParsedConversationArray() {
        return this.parsedArray;
    }

    clear() {
        this.parsedArray = [];
        this.sk.core.clearConversationData();
    }
}