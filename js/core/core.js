class Core {

    constructor(sketch) {
        this.sk = sketch;
        this.testData = new TestData(); // encapsulates various tests for parsing data
        // PARSING CLASSES
        this.parseMovement = new ParseMovement(this.sk, this.testData);
        this.parseConversation = new ParseConversation(this.sk, this.testData);
        this.parseCodes = new ParseCodes(this.sk, this.testData);
        // PROGRAM DATA
        this.speakerList = []; // Speaker object Array created from parsed conversation file
        this.pathList = []; // Path object array created from parsed data
        this.codeList = [];
        this.inputFloorPlan = new InputFloorPlan(this.sk); // class to hold floorplan image and associated methods
        this.totalTimeInSeconds = 0; // Time value in seconds that all displayed data is set to, set dynamically when updating movement data
        this.COLOR_LIST = ['#6a3d9a', '#ff7f00', '#33a02c', '#1f78b4', '#e31a1c', '#ffff99', '#b15928', '#cab2d6', '#fdbf6f', '#b2df8a', '#a6cee3', '#fb9a99']; // 12 Class Paired: (Dark) purple, orange, green, blue, red, yellow, brown, (Light) lPurple, lOrange, lGreen, lBlue, lRed
    }

    updateMovement(pathName, movementPointArray, conversationPointArray) {
        this.pathList.push(this.createPath(pathName, movementPointArray, conversationPointArray));
        this.pathList = this.sortByName(this.pathList);
        this.setTotalTime(movementPointArray);
        this.sk.loop(); // rerun P5 draw loop
    }

    updateConversation(parsedConversationFile) {
        this.setSpeakerList(parsedConversationFile);
        this.speakerList = this.sortByName(this.speakerList);
        this.parseMovement.reProcessAllPointArrays(); // must reprocess movement
        this.sk.loop(); // rerun P5 draw loop
    }

    updateCodes(codeName) {
        this.codeList.push(this.createCode(codeName));
        this.codeList = this.sortByName(this.codeList);
        this.sk.loop(); // rerun P5 draw loop
    }

    setTotalTime(movementPointArray) {
        const curPathEndTime = Math.floor(movementPointArray[movementPointArray.length - 1].time);
        if (this.totalTimeInSeconds < curPathEndTime) this.totalTimeInSeconds = curPathEndTime; // update global total time, make sure to floor value as integer
    }

    setSpeakerList(parsedConversationArray) {
        for (const curRow of parsedConversationArray) {
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
     * Organizes retrieval of path color depending on whether conversation file has been loaded
     * @param  {Char} name
     */
    getCurPathColor(name) {
        if (this.sk.arrayIsLoaded(this.speakerList)) return this.setPathColorBySpeaker(name);
        else return this.COLOR_LIST[this.pathList.length % this.COLOR_LIST.length]; // color is next in Color list
    }

    /**
     * If path has corresponding speaker, returns color that matches speaker
     * Otherwise returns color from colorList based on num of speakers + numOfPaths that do not have corresponding speaker
     * @param  {char} pathName
     */
    setPathColorBySpeaker(pathName) {
        if (this.speakerList.some(e => e.name === pathName)) {
            const hasSameName = (element) => element.name === pathName; // condition to satisfy/does it have pathName
            return this.speakerList[this.speakerList.findIndex(hasSameName)].color; // returns first index that satisfies condition/index of speaker that matches pathName
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

    /**
     * Path and Speaker objects are separate so that each speaker and path object can match or vary for different number of movement files and speakers
     */
    createPath(name, movementPointArray, conversationPointArray) {
        return {
            name, // Char matches 1st letter of CSV file
            color: this.getCurPathColor(name),
            isShowing: true, // boolean used to indicate if speaker showing in GUI
            movement: movementPointArray,
            conversation: conversationPointArray
        }
    }

    createSpeaker(name) {
        return {
            name, // string
            color: this.COLOR_LIST[this.speakerList.length % this.COLOR_LIST.length],
            isShowing: true // boolean indicating if showing in GUI
        };
    }

    createCode(name) {
        return {
            name, // first letter of filename
            color: 150, // color drawn in GUI
            isShowing: false // if displaying in GUI
        };
    }

    clearAll() {
        this.inputFloorPlan.clear();
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