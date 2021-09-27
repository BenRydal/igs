class Core {

    constructor(sketch) {
        this.sk = sketch;
        this.testData = new TestData(); // encapsulates various tests for parsing data
        this.parseMovement = new ParseMovement(this.sk, this.testData); // holds loaded movement file(s) and parsing methods
        this.parseConversation = new ParseConversation(this.sk, this.testData); // holds loaded conversation file and parsing methods
        this.parseCodes = new ParseCodes(this.sk, this.testData);

        this.speakerList = []; // List of Speaker objects used in program created from conversation file
        this.pathList = []; // List of Path objects used in program created from movement file
        this.codeList = [];

        this.inputFloorPlan = new InputFloorPlan(this.sk); // holds floorplan image and associated methods
        this.totalTimeInSeconds = 0; // Number indicating time value in seconds that all displayed data is set to, set dynamically by parseMovement
        this.COLOR_LIST = ['#6a3d9a', '#ff7f00', '#33a02c', '#1f78b4', '#e31a1c', '#ffff99', '#b15928', '#cab2d6', '#fdbf6f', '#b2df8a', '#a6cee3', '#fb9a99']; // 12 Class Paired: (Dark) purple, orange, green, blue, red, yellow, brown, (Light) lPurple, lOrange, lGreen, lBlue, lRed
    }

    /** 
     * @param {Char} pathName
     * @param {Array} movementPointArray
     * @param {Array} conversationPointArray
     */

    updateMovementData(pathName, movementPointArray, conversationPointArray) {
        this.pathList.push(this.createPath(pathName, movementPointArray, conversationPointArray));
        this.pathList = this.sortByName(this.pathList);
        this.updateTotalTime(movementPointArray);
        this.sk.loop(); // rerun P5 draw loop
    }

    updateConversationData(parsedConversationFile) {
        this.updateSpeakerList(parsedConversationFile);
        this.speakerList = this.sortByName(this.speakerList);
        this.parseMovement.reProcessPointArrays(); // must reprocess movement
        this.sk.loop(); // rerun P5 draw loop
    }

    updateCodeData(name, codeArray) {
        this.codeList.push(this.createCode(name, codeArray));
        this.codeList = this.sortByName(this.codeList);
    }

    updateTotalTime(movementPointArray) {
        const curPathEndTime = Math.floor(movementPointArray[movementPointArray.length - 1].time);
        if (this.totalTimeInSeconds < curPathEndTime) this.totalTimeInSeconds = curPathEndTime; // update global total time, make sure to floor value as integer
    }

    updateSpeakerList(parsedConversationArray) {
        for (const curRow of parsedConversationArray) {
            let tempSpeakerList = []; // create/populate temp list to store strings to test from global core.speakerList
            for (const tempSpeaker of this.speakerList) tempSpeakerList.push(tempSpeaker.name);
            // If row is good data, test if core.speakerList already has speaker and if not add speaker 
            if (this.testData.conversationRowForType(curRow)) {
                const speaker = this.testData.cleanSpeaker(curRow[this.testData.headersConversation[1]]); // get cleaned speaker character
                if (!tempSpeakerList.includes(speaker)) this.addSpeakerToSpeakerList(speaker);
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

    /**
     * Adds new speaker object with initial color to core.speakerList from string
     * @param  {String} speaker
     */
    addSpeakerToSpeakerList(name) {
        this.speakerList.push(this.createSpeaker(name, this.COLOR_LIST[this.speakerList.length % this.COLOR_LIST.length], true));
    }

    sortByName(list) {
        return list.sort((a, b) => (a.name > b.name) ? 1 : -1);
    }

    createPath(name, movement, conversation) {
        return {
            name, // Char matches 1st letter of CSV file
            movement, // Array of MovementPoint objects
            conversation, // Array of ConversationPoint objects
            color: this.getCurPathColor(name),
            isShowing: true // boolean used to indicate if speaker showing in GUI
        }
    }

    /**
     * NOTE: Speaker and Path objects are separate so that each speaker and path object can match/correspond to the same person but can also vary to allow for different number of movement files and speakers.
     */
    createSpeaker(name, color, isShowing) {
        return {
            name, // string
            color, // color
            isShowing // boolean indicating if showing in GUI
        };
    }

    createCode(name) {
        return {
            name, // first letter of filename
            color: 150, // color drawn in GUI
            isShowing: false // if displaying in GUI
        };
    }

    clearAllData() {
        this.inputFloorPlan.clear();
        this.parseConversation.clear();
        this.parseMovement.clear();
        this.parseCodes.clear();
    }

    clearConversationData() {
        this.speakerList = [];
        this.pathList = [];
    }

    clearMovementData() {
        this.pathList = [];
        this.totalTimeInSeconds = 0;
    }

    clearCodeData() {
        this.pathList = [];
        this.codeList = [];
    }
}