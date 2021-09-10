class Core {

    constructor(sketch) {
        this.sk = sketch;
        this.parsedMovementFileData = []; // List that holds objects containing a parsed results.data array and character letter indicating path name from Papa Parsed CSV file
        this.parsedConversationArray = []; // List that holds a parsed results.data array from Papa parsed conversation CSV file
        this.speakerList = []; // List that holds Speaker objects parsed from conversation file
        this.paths = []; // List of path objects
        this.inputFloorPlan = {
            img: null,
            width: null,
            height: null
        }
        this.totalTimeInSeconds = 0; // Number indicating time value in seconds that all displayed data is set to, set dynamically in processMovement methods
        this.COLOR_LIST = ['#6a3d9a', '#ff7f00', '#33a02c', '#1f78b4', '#e31a1c', '#ffff99', '#b15928', '#cab2d6', '#fdbf6f', '#b2df8a', '#a6cee3', '#fb9a99']; // 12 Class Paired: (Dark) purple, orange, green, blue, red, yellow, brown, (Light) lPurple, lOrange, lGreen, lBlue, lRed
    }

    /**
     * Creates P5 image file from path and updates core floorPlan image and input width/heights to properly scale and display data
     * @param  {String} filePath
     */
    updateFloorPlan(filePath) {
        this.sk.loadImage(filePath, img => {
            console.log("Floor Plan Image Loaded");
            img.onload = () => URL.revokeObjectURL(this.src);
            this.sk.sketchController.startLoop(); // rerun P5 draw loop after loading image
            this.inputFloorPlan.img = img;
            this.inputFloorPlan.width = img.width;
            this.inputFloorPlan.height = img.height;
        }, e => {
            alert("Error loading floor plan image file. Please make sure it is correctly formatted as a PNG or JPG image file.")
            console.log(e);
        });
    }

    /** 
     * Organizes methods to process and update core parsedMovementFileData []
     * @param {Integer} fileNum
     * @param {PapaParse Results []} results
     * @param {CSV} file
     * @param {Array} MovementPoints
     * @param {Array} ConversationPoints
     */
    updateMovement(fileNum, parsedMovementArray, file, movementPointArray, conversationPointArray) {
        if (fileNum === 0) this.clearMovementData(); // clear existing movement data for first new file only
        const pathName = file.name.charAt(0).toUpperCase(); // get name of path, also used to test if associated speaker in conversation file
        this.updatePaths(pathName, movementPointArray, conversationPointArray);
        this.updateTotalTime(movementPointArray);
        this.parsedMovementFileData.push({
            parsedMovementArray: parsedMovementArray,
            firstCharOfFileName: pathName
        }); // add results and pathName to core []
        this.sk.sketchController.startLoop(); // rerun P5 draw loop
    }

    /**
     * Adds new Path object to and sorts core paths []. Also updates time in seconds in program 
     * @param  {char} pathName
     * @param  {MovementPoint []} movement
     * @param  {ConversationPoint []} conversation
     */
    updatePaths(pathName, movementPointArray, conversationPointArray) {
        let curPathColor;
        if (this.sk.testData.arrayIsLoaded(this.speakerList)) curPathColor = this.setPathColorBySpeaker(pathName); // if conversation file loaded, send to method to calculate color
        else curPathColor = this.COLOR_LIST[this.paths.length % this.COLOR_LIST.length]; // if no conversation file loaded path color is next in Color list
        this.paths.push(this.createPath(pathName, movementPointArray, conversationPointArray, curPathColor, true));
        this.paths.sort((a, b) => (a.name > b.name) ? 1 : -1); // sort list so it appears nicely in GUI matching core.speakerList array
    }


    updateTotalTime(movementPointArray) {
        const curPathEndTime = Math.floor(movementPointArray[movementPointArray.length - 1].time);
        if (this.totalTimeInSeconds < curPathEndTime) this.totalTimeInSeconds = curPathEndTime; // update global total time, make sure to floor value as integer
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
        for (const path of this.paths) {
            if (!this.speakerList.some(e => e.name === path.name)) count++;
        }
        return count;
    }

    /**
     *  @param {PapaParse Results []} results
     */
    updateConversation(parsedConversationArray) {
        this.clearConversationData(); // clear existing conversation data
        this.parsedConversationArray = parsedConversationArray; // set to new array of keyed values
        this.updateSpeakerList(this.parsedConversationArray);
        this.speakerList.sort((a, b) => (a.name > b.name) ? 1 : -1); // sort list so it appears nicely in GUI matching core.paths array
        this.sk.sketchController.startLoop(); // rerun P5 draw loop
    }

    /**
     * Updates core speaker list from conversation file data/results
     */
    updateSpeakerList(parsedConversationArray) {
        for (let i = 0; i < parsedConversationArray.length; i++) {
            let tempSpeakerList = []; // create/populate temp list to store strings to test from global core.speakerList
            for (const tempSpeaker of this.speakerList) tempSpeakerList.push(tempSpeaker.name);
            // If row is good data, test if core.speakerList already has speaker and if not add speaker 
            if (this.sk.testData.conversationLengthAndRowForType(parsedConversationArray, i)) {
                const speaker = this.cleanSpeaker(parsedConversationArray[i][this.sk.testData.CSVHEADERS_CONVERSATION[1]]); // get cleaned speaker character
                if (!tempSpeakerList.includes(speaker)) this.addSpeakerToSpeakerList(speaker);
            }
        }
    }

    /**
     * From String, trims white space, converts to uppercase and returns sub string of 2 characters
     * @param  {String} s
     */
    cleanSpeaker(string) {
        return string.trim().toUpperCase().substring(0, 2);
    }

    /**
     * Adds new speaker object with initial color to core.speakerList from character
     * @param  {Char} speaker
     */
    addSpeakerToSpeakerList(name) {
        this.speakerList.push(this.createSpeaker(name, this.COLOR_LIST[this.speakerList.length % this.COLOR_LIST.length], true));
    }

    /**
     * NOTE: Speaker and Path objects are separate due to how shapes are drawn in browser on Canvas element. Each speaker and path object can match/correspond to the same person but can also vary to allow for different number of movement files and speakers.
     */
    createSpeaker(name, color, isShowing) {
        return {
            name, // substring
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
        this.clearFloorPlan();
        this.clearConversationData();
        this.clearMovementData();
    }

    clearFloorPlan() {
        this.inputFloorPlan.img = null;
        this.inputFloorPlan.width = null;
        this.inputFloorPlan.height = null;
    }

    clearConversationData() {
        this.parsedConversationArray = [];
        this.speakerList = [];
        this.paths = [];
    }

    clearMovementData() {
        this.parsedMovementFileData = [];
        this.paths = [];
        this.totalTimeInSeconds = 0; // reset total time
    }
}