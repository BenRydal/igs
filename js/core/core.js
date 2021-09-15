class Core {

    constructor(sketch) {
        this.sk = sketch;
        this.parseMovement = new ParseMovement(this.sk);
        this.parseConversation = new ParseConversation(this.sk);
        this.speakerList = []; // List that holds Speaker objects parsed from conversation file
        this.pathList = []; // List of path objects
        this.inputFloorPlan = new InputFloorPlan(this.sk);
        this.totalTimeInSeconds = 0; // Number indicating time value in seconds that all displayed data is set to, set dynamically in processMovement methods
        this.COLOR_LIST = ['#6a3d9a', '#ff7f00', '#33a02c', '#1f78b4', '#e31a1c', '#ffff99', '#b15928', '#cab2d6', '#fdbf6f', '#b2df8a', '#a6cee3', '#fb9a99']; // 12 Class Paired: (Dark) purple, orange, green, blue, red, yellow, brown, (Light) lPurple, lOrange, lGreen, lBlue, lRed
    }

    /** 
     * @param {Char} pathName
     * @param {Array} movementPointArray
     * @param {Array} conversationPointArray
     */
    updateMovementData(pathName, movementPointArray, conversationPointArray) {
        this.updatePaths(pathName, movementPointArray, conversationPointArray);
        this.updateTotalTime(movementPointArray);
        this.sk.sketchController.startLoop(); // rerun P5 draw loop
    }

    updateConversationData() {
        this.updateSpeakerList(this.parseConversation.getParsedConversationArray());
        this.speakerList.sort((a, b) => (a.name > b.name) ? 1 : -1); // sort list so it appears nicely in GUI matching core.pathList array
        this.parseMovement.reProcessPointArrays(); // must reprocess movement
        this.sk.sketchController.startLoop(); // rerun P5 draw loop
    }

    updatePaths(pathName, movementPointArray, conversationPointArray) {
        let curPathColor;
        if (this.sk.testData.arrayIsLoaded(this.speakerList)) curPathColor = this.setPathColorBySpeaker(pathName); // if conversation file loaded, send to method to calculate color
        else curPathColor = this.COLOR_LIST[this.pathList.length % this.COLOR_LIST.length]; // if no conversation file loaded path color is next in Color list
        this.pathList.push(this.createPath(pathName, movementPointArray, conversationPointArray, curPathColor, true));
        this.pathList.sort((a, b) => (a.name > b.name) ? 1 : -1); // sort list so it appears nicely in GUI matching core.speakerList array
    }


    updateTotalTime(movementPointArray) {
        const curPathEndTime = Math.floor(movementPointArray[movementPointArray.length - 1].time);
        if (this.totalTimeInSeconds < curPathEndTime) this.totalTimeInSeconds = curPathEndTime; // update global total time, make sure to floor value as integer
    }

    /**
     * Updates core speaker list from conversation file data/results
     */
    updateSpeakerList(parsedConversationArray) {
        for (let i = 0; i < parsedConversationArray.length; i++) {
            let tempSpeakerList = []; // create/populate temp list to store strings to test from global core.speakerList
            for (const tempSpeaker of this.speakerList) tempSpeakerList.push(tempSpeaker.name);
            // If row is good data, test if core.speakerList already has speaker and if not add speaker 
            if (this.sk.testData.conversationRowForType(parsedConversationArray, i)) {
                const speaker = this.cleanSpeaker(parsedConversationArray[i][this.sk.testData.CSVHEADERS_CONVERSATION[1]]); // get cleaned speaker character
                if (!tempSpeakerList.includes(speaker)) this.addSpeakerToSpeakerList(speaker);
            }
        }
    }

    /**
     * If path has corresponding speaker, returns color that matches speaker
     * Otherwise returns color from global this.COLOR_LIST based on num of speakers + numOfPaths that do not have corresponding speaker
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
     * Used to compare and add new speakers to speakerList
     * @param  {String} s
     */
    cleanSpeaker(string) {
        return string.trim().toUpperCase().substring(0, 2);
    }

    /**
     * Used to compare and add new paths to pathList
     * NOTE: this may need to match cleanSpeaker in the future
     * @param  {String} s
     */
    cleanPathName(string) {
        return string.charAt(0).toUpperCase();
    }

    /**
     * Adds new speaker object with initial color to core.speakerList from string
     * @param  {String} speaker
     */
    addSpeakerToSpeakerList(name) {
        this.speakerList.push(this.createSpeaker(name, this.COLOR_LIST[this.speakerList.length % this.COLOR_LIST.length], true));
    }

    /**
     * NOTE: Speaker and Path objects are separate due to how shapes are drawn in browser on Canvas element. Each speaker and path object can match/correspond to the same person but can also vary to allow for different number of movement files and speakers.
     */
    createSpeaker(name, color, isShowing) {
        return {
            name, // string
            color, // color
            isShowing // boolean indicating if showing in GUI
        };
    }

    createPath(name, movement, conversation, color, isShowing) {
        return {
            name, // Char matches 1st letter of CSV file
            movement, // Array of MovementPoint objects
            conversation, // Array of ConversationPoint objects
            color, // color
            isShowing // boolean used to indicate if speaker showing in GUI
        }
    }

    clearAllData() {
        this.inputFloorPlan.clear();
        this.clearConversationData();
        this.parseConversation.clear();
        this.clearMovementData();
        this.parseMovement.clear();
    }

    clearConversationData() {
        this.speakerList = [];
        this.pathList = [];
    }

    clearMovementData() {
        this.pathList = [];
        this.totalTimeInSeconds = 0;
    }
}