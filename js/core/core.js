class Core {

    constructor(sketch) {
        this.sk = sketch;
        // Parsing Classes
        this.testData = new TestData(); // encapsulates various tests for parsing data
        this.parseMovement = new ParseMovement(this.sk, this.testData);
        this.parseConversation = new ParseConversation(this.sk, this.testData);
        this.parseCodes = new ParseCodes(this.sk, this.testData);
        // Program Data
        this.speakerList = []; // Holds speaker objects for number of speakers parsed from successfully loaded conversation file
        this.pathList = []; // Holds path objects for each successfully loaded movement file
        this.codeList = []; // holds code objects for each successfully loaded code file
        this.totalTimeInSeconds = 0; // Time value in seconds that all displayed data is set to, set dynamically when updating movement data
        this.COLOR_LIST = ['#6a3d9a', '#ff7f00', '#33a02c', '#1f78b4', '#e31a1c', '#ffff99', '#b15928', '#cab2d6', '#fdbf6f', '#b2df8a', '#a6cee3', '#fb9a99']; // 12 Class Paired: (Dark) purple, orange, green, blue, red, yellow, brown, (Light) lPurple, lOrange, lGreen, lBlue, lRed
    }

    /**
     * @param  {PapaParse results Array} results
     * @param  {File} file
     */
    testParsedResultsForProcessing(results, file) {
        if (this.testData.parsedResults(results, this.testData.headersMovement, this.testData.movementRowForType)) this.parseMovement.processFile(results, file);
        else if (this.testData.parsedResults(results, this.testData.headersConversation, this.testData.conversationRowForType)) this.parseConversation.processFile(results, file);
        // test multiCodeFile before singleCodeFile because it has same headers with one additional header
        else if (this.testData.parsedResults(results, this.testData.headersMultiCodes, this.testData.multiCodeRowForType)) this.parseCodes.processMultiCodeFile(results);
        else if (this.testData.parsedResults(results, this.testData.headersSingleCodes, this.testData.codeRowForType)) this.parseCodes.processSingleCodeFile(results, file);
        else alert("Error loading CSV file. Please make sure your file is a CSV file formatted with correct column headers");
    }

    /**
     * Method to update movement program data and GUI
     * NOTE: order is critical 
     * @param  {Char} pathName First character letter of filename
     * @param  {Array} movementPointArray
     * @param  {Array} conversationPointArray
     */
    updateMovement(pathName, movementPointArray, conversationPointArray) {
        this.sk.domController.removeAllElements("movementMainTab"); // remove all GUI/checkbox elements from dom
        this.pathList.push(this.createPath(pathName, movementPointArray, conversationPointArray)); // update data list
        this.pathList = this.sortByName(this.pathList); // then sort
        for (const path of this.pathList) this.sk.domController.updateMainTab(path, "movementMainTab"); // add new set of GUI/checkbox elements to the DOM
        this.setTotalTime(movementPointArray);
        this.parseCodes.resetCounters(); // must reset code counters if multiple paths are loaded
        this.sk.loop(); // rerun P5 draw loop
    }

    /**
     * NOTE: method follows same format as updateMovement with a few minor differences
     * @param  {PapaParse results Array} parsedConversationFileArray
     */
    updateConversation(parsedConversationFileArray) {
        this.sk.domController.removeAllElements("conversationMainTab");
        this.setSpeakerList(parsedConversationFileArray);
        this.speakerList = this.sortByName(this.speakerList);
        for (const speaker of this.speakerList) this.sk.domController.updateMainTab(speaker, "conversationMainTab");
        this.parseMovement.reProcessAllPointArrays(); // must reprocess movement
        this.sk.loop(); // rerun P5 draw loop
    }

    updateCodes(codeName) {
        this.sk.domController.removeAllElements("codesMainTab");
        this.codeList.push(this.createCode(codeName));
        for (const code of this.codeList) this.sk.domController.updateMainTab(code, "codesMainTab");
        this.sk.domController.updateCodeColorTab("codesMainTab");
        this.clearMovement();
        this.parseMovement.reProcessAllPointArrays();
        this.sk.loop(); // rerun P5 draw loop
    }

    setTotalTime(movementPointArray) {
        const curPathEndTime = Math.floor(movementPointArray[movementPointArray.length - 1].time);
        if (this.totalTimeInSeconds < curPathEndTime) this.totalTimeInSeconds = curPathEndTime; // update global total time, make sure to floor value as integer
    }

    setSpeakerList(parsedConversationFileArray) {
        for (const curRow of parsedConversationFileArray) {
            let tempSpeakerList = []; // create/populate temp list to store strings to test from global core.speakerList
            for (const tempSpeaker of this.speakerList) tempSpeakerList.push(tempSpeaker.name);
            // If row is good data, test if core.speakerList already has speaker and if not add speaker 
            if (this.testData.conversationRowForType(curRow)) {
                const speaker = this.testData.cleanSpeaker(curRow[this.testData.headersConversation[1]]); // get cleaned speaker character
                if (!tempSpeakerList.includes(speaker)) this.speakerList.push(this.createSpeaker(speaker));
            }
        }
    }

    /**
     * Path and Speaker objects are separate so that each speaker and path object can match or vary for different number of movement files and speakers
     * NOTE: Path, Speaker, and Code MUST all have a name, isShowing and color attributes
     */
    createPath(name, movementPointArray, conversationPointArray) {
        return {
            name, // Char first letter of filename
            isShowing: true, // boolean used to indicate if speaker showing in GUI
            color: this.createColorForGUI(this.getPathModeColor(name), this.sk.COLORGRAY),
            movement: movementPointArray,
            conversation: conversationPointArray
        }
    }

    createSpeaker(name) {
        return {
            name, // String up to 2 characters
            isShowing: true, // boolean indicating if showing in GUI
            color: this.createColorForGUI(this.COLOR_LIST[this.speakerList.length % this.COLOR_LIST.length], this.sk.COLORGRAY)
        };
    }

    createCode(name) {
        return {
            name, // Char first letter of filename
            isShowing: false, // if displaying in GUI
            color: this.createColorForGUI(this.sk.COLORGRAY, this.COLOR_LIST[this.codeList.length % this.COLOR_LIST.length])
        };
    }

    /**
     * Color for each Path, Speaker and Code Object has pathMode and codeMode. These are important to how data is colored in GUI.
     */
    createColorForGUI(pathModeColor, codeModeColor) {
        return {
            pathMode: pathModeColor,
            codeMode: codeModeColor
        }
    }

    /**
     * Organizes retrieval of path color depending on whether conversation file has been loaded
     * @param  {Char} name
     */
    getPathModeColor(name) {
        if (this.sk.arrayIsLoaded(this.speakerList)) return this.setPathModeColorBySpeaker(name);
        else return this.COLOR_LIST[this.pathList.length % this.COLOR_LIST.length]; // color is next in Color list
    }

    /**
     * If path has corresponding speaker, returns color that matches speaker
     * Otherwise returns color from colorList based on num of speakers + numOfPaths that do not have corresponding speaker
     * @param  {char} pathName
     */
    setPathModeColorBySpeaker(pathName) {
        if (this.speakerList.some(e => e.name === pathName)) {
            const hasSameName = (element) => element.name === pathName; // condition to satisfy/does it have pathName
            return this.speakerList[this.speakerList.findIndex(hasSameName)].color.pathMode; // returns first index that satisfies condition/index of speaker that matches pathName
        } else return this.COLOR_LIST[this.speakerList.length + this.getNumPathsWithNoSpeaker() % this.COLOR_LIST.length]; // assign color to path
    }

    /**
     * Returns number of movement Paths that do not have corresponding speaker
     */
    getNumPathsWithNoSpeaker() {
        let count = 0;
        for (const path of this.pathList) {
            if (!this.speakerList.some(e => e.name === path.name)) count++;
        }
        return count;
    }

    sortByName(list) {
        return list.sort((a, b) => (a.name > b.name) ? 1 : -1);
    }

    clearAll() {
        this.parseMovement.clear();
        this.parseConversation.clear();
        this.parseCodes.clear();
    }

    clearMovement() {
        this.pathList = [];
        this.totalTimeInSeconds = 0;
    }

    clearConversation() {
        this.pathList = [];
        this.speakerList = [];
    }

    clearCodes() {
        this.pathList = [];
        this.codeList = [];
    }
}