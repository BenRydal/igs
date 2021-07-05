class Core {

    constructor() {
        // CORE DATA VARIABLES
        this.movementFileResults = []; // List that holds a results array and character letter indicating path name from a parsed movement .CSV file
        this.conversationFileResults = []; // List that holds a results array and file data from a parsed conversation .CSV file
        this.speakerList = []; // List that holds Speaker objects parsed from conversation file
        this.paths = []; // List that holds path objects for each unique set of movement and conversation points constructed from parsed conversation and movement .CSV files
        this.floorPlan = {
            img: null,
            inputPixelWidth: null,
            inputPixelHeight: null
        }
        this.videoPlayer = null; // abstract class for different play classes instantiated/updated in processVideo method (see video-player.js)
        this.totalTimeInSeconds = 0; // Number indicating time value in seconds that all displayed data is set to, set dynamically in processMovement methods
        this.COLOR_LIST = ['#6a3d9a', '#ff7f00', '#33a02c', '#1f78b4', '#e31a1c', '#ffff99', '#b15928', '#cab2d6', '#fdbf6f', '#b2df8a', '#a6cee3', '#fb9a99']; // 12 Class Paired: (Dark) purple, orange, green, blue, red, yellow, brown, (Light) lPurple, lOrange, lGreen, lBlue, lRed
    }

    /**
     * Creates P5 image file from path and updates core floorPlan image and input width/heights to properly scale and display data
     * @param  {String} filePath
     */
    updateFloorPlan(filePath) {
        loadImage(filePath, img => {
            console.log("Floor Plan Image Loaded");
            img.onload = () => URL.revokeObjectURL(this.src);
            loop(); // rerun P5 draw loop after loading image
            this.floorPlan.img = img;
            this.floorPlan.inputPixelWidth = img.width;
            this.floorPlan.inputPixelHeight = img.height;
        }, e => {
            alert("Error loading floor plan image file. Please make sure it is correctly formatted as a PNG or JPG image file.")
            console.log(e);
        });
    }

    /**
     * Replaces existing core.videoPlayer object with new VideoPlayer object (YouTube or P5FilePlayer)
     * @param  {String} platform
     * @param  {VideoPlayer Specific Params} params
     */
    updateVideo(platform, params) {
        if (testData.dataIsLoaded(core.videoPlayer)) core.videoPlayer.destroy();
        switch (platform) {
            case "Youtube":
                core.videoPlayer = new YoutubePlayer(params);
                break;
            case "File":
                core.videoPlayer = new P5FilePlayer(params);
                break;
        }
    }

    /** 
     * Organizes methods to process and update core movementFileResults []
     * @param {Integer} fileNum
     * @param {PapaParse Results []} results
     * @param {CSV} file
     * @param {[]]} MovementPoints
     * @param {[]]} ConversationPoints
     */
    updateMovement(fileNum, results, file, movement, conversation) {
        if (fileNum === 0) core.clearMovementData(); // clear existing movement data for first new file only
        const pathName = file.name.charAt(0).toUpperCase(); // get name of path, also used to test if associated speaker in conversation file
        this.updatePaths(pathName, movement, conversation);
        this.updateTotalTime(movement);
        this.movementFileResults.push([results, pathName]); // add results and pathName to core []
        loop(); // rerun P5 draw loop
    }

    /**
     * Adds new Path object to and sorts core paths []. Also updates time in seconds in program 
     * @param  {char} letterName
     * @param  {MovementPoint []} movement
     * @param  {ConversationPoint []} conversation
     */
    updatePaths(letterName, movement, conversation) {
        let curPathColor;
        if (testData.arrayIsLoaded(this.speakerList)) curPathColor = this.setPathColorBySpeaker(letterName); // if conversation file loaded, send to method to calculate color
        else curPathColor = this.COLOR_LIST[this.paths.length % this.COLOR_LIST.length]; // if no conversation file loaded path color is next in Color list
        this.paths.push(this.createPath(letterName, movement, conversation, curPathColor, true));
        this.paths.sort((a, b) => (a.name > b.name) ? 1 : -1); // sort list so it appears nicely in GUI matching core.speakerList array
    }


    updateTotalTime(movement) {
        const curPathEndTime = Math.floor(movement[movement.length - 1].time);
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
     *  @param  {PapaParse Results []} results
     */
    updateConversation(results) {
        this.clearConversationData(); // clear existing conversation data
        this.conversationFileResults = results.data; // set to new array of keyed values
        this.updateSpeakerList();
        this.speakerList.sort((a, b) => (a.name > b.name) ? 1 : -1); // sort list so it appears nicely in GUI matching core.paths array
        loop(); // rerun P5 draw loop
    }

    /**
     * Updates core speaker list from conversation file data/results
     */
    updateSpeakerList() {
        for (let i = 0; i < this.conversationFileResults.length; i++) {
            let tempSpeakerList = []; // create/populate temp list to store strings to test from global core.speakerList
            for (const tempSpeaker of this.speakerList) tempSpeakerList.push(tempSpeaker.name);
            // If row is good data, test if core.speakerList already has speaker and if not add speaker 
            if (testData.conversationLengthAndRowForType(this.conversationFileResults, i)) {
                const speaker = this.cleanSpeaker(this.conversationFileResults[i][CSVHEADERS_CONVERSATION[1]]); // get cleaned speaker character
                if (!tempSpeakerList.includes(speaker)) this.addSpeakerToSpeakerList(speaker);
            }
        }
    }


    /**
     * From String, trims white space, converts to uppercase and returns sub string of 2 characters
     * @param  {String} s
     */
    cleanSpeaker(s) {
        return s.trim().toUpperCase().substring(0, 2);
    }

    /**
     * Adds new speaker object with initial color to global core.speakerList from character
     * @param  {Char} speaker
     */
    addSpeakerToSpeakerList(name) {
        this.speakerList.push(this.createSpeaker(name, this.COLOR_LIST[this.speakerList.length % this.COLOR_LIST.length], true));
    }

    /**
     * CORE DATA FACTORY FUNCTIONS
     * Speaker and Path objects are separate due to how shapes are drawn in browser on Canvas element.
     * Each speaker and path object can match/correspond to the same person but can also vary to
     * allow for different number of movement files and speakers.
     */

    /**
     * Factory function that creates a Speaker object
     * @param  {char} name // name of speaker
     * @param  {color} color // color of speaker
     * @param  {boolean} show // if speaker is showing in GUI
     */
    createSpeaker(name, color, show) {
        return {
            name,
            color,
            show
        };
    }

    /**
     * Factory function that creates a speaker Path object
     * @param  {char} name // Name of Path. Matches 1st letter of CSV file
     * @param  {MovementPoint []} movement // Path is comprised of 2 arrays of MovementPoint and ConversationPoint objects
     * @param  {ConversationPoint []} conversation
     * @param  {color} color // color of Path
     * @param  {boolean} show // if speaker is showing in GUI
     */
    createPath(name, movement, conversation, color, show) {
        return {
            name,
            movement,
            conversation,
            color,
            show
        }
    }

    clearAllData() {
        loop(); // rerun P5 draw loop
        if (testData.dataIsLoaded(core.videoPlayer)) {
            if (this.isModeVideoShowing) keys.overVideoButton(); // Turn off video before destroying it if showing
            core.videoPlayer.destroy(); // if there is a video, destroy it
            core.videoPlayer = null; // set core.videoPlayer to null
        }
        this.clearFloorPlan();
        this.clearConversationData();
        this.clearMovementData();
    }

    clearFloorPlan() {
        this.floorPlan.img = null;
        this.floorPlan.inputPixelWidth = null;
        this.floorPlan.inputPixelHeight = null;
    }

    clearConversationData() {
        this.conversationFileResults = [];
        this.speakerList = [];
        this.paths = [];
    }

    clearMovementData() {
        this.movementFileResults = [];
        this.paths = [];
        this.totalTimeInSeconds = 0; // reset total time
    }
}