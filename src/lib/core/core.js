/**
 * This class holds core program data and associated parsing methods from processed CSV files.
 * Separate parsing classes for movement, conversation, and code CSV files test parsed data from PapaParse
 * results and generate different data structures
 * These data structures are integrated into a Path object which is the central data structure for the IGS
 * Original data from each CSV file is stored within each parsing class for re-processing as new data is loaded
 * Each time CSV file is successfully loaded and parsed, domController is called to update GUI elements
 *
 */

import { CoreUtils } from './core-utils.js';
import { ParseMovement } from './parse-movement.js';
import { ParseConversation } from './parse-conversation.js';
import { ParseCodes } from './parse-codes.js';
// import { DataPoint } from '../../routes/sketch/dataPoint.js';
// import { User } from '../../routes/sketch/user.js';

import { DataPoint } from '../../models/dataPoint';
import { User } from '../../models/user';
export class Core {

    constructor(sketch) {
        this.sk = sketch;
        this.coreUtils = new CoreUtils(); // utilities for testing CSV files
        this.parseMovement = new ParseMovement(this.sk, this.coreUtils);
        this.parseConversation = new ParseConversation(this.sk, this.coreUtils);
        this.parseCodes = new ParseCodes(this.sk, this.coreUtils);
        // Core program data
        /**
         * @type {any[]}
         */
        this.userList = []; // Holds user objects for each successfully loaded user file
        // this.speakerList = []; // Holds speaker objects for number of speakers parsed from successfully loaded conversation file
        // this.pathList = []; // Holds path objects for each successfully loaded movement file
        // this.codeList = []; // holds code objects for each successfully loaded code file
        this.totalTimeInSeconds = 0; // Time value in seconds that all displayed data is set to, set dynamically when updating movement data
        this.COLORGRAY = "#A9A9A9"; // should match representation of data in GUI
        this.COLOR_LIST = ['#6a3d9a', '#ff7f00', '#33a02c', '#1f78b4', '#e31a1c', '#b15928', '#cab2d6', '#fdbf6f', '#b2df8a', '#a6cee3', '#fb9a99', '#ffed6f']; // 12 Class Paired: (Dark) purple, orange, green, blue, red, brown, (Light) lPurple, lOrange, lGreen, lBlue, lRed, yellow
    }

    /**
     * @param  {PapaParse results Array} results
     * @param  {File} file
     */
    testPapaParseResultsForProcessing(results, file) {
        if (this.coreUtils.testPapaParseResults(results, this.coreUtils.headersMovement, this.coreUtils.movementRowForType)) this.parseMovement.processFile(results, file);
        else if (this.coreUtils.testPapaParseResults(results, this.coreUtils.headersConversation, this.coreUtils.conversationRowForType)) this.parseConversation.processFile(results, file);
        // test multiCodeFile before singleCodeFile because it has same headers with one additional header
        else if (this.coreUtils.testPapaParseResults(results, this.coreUtils.headersMultiCodes, this.coreUtils.multiCodeRowForType)) this.parseCodes.processMultiCodeFile(results);
        else if (this.coreUtils.testPapaParseResults(results, this.coreUtils.headersSingleCodes, this.coreUtils.codeRowForType)) this.parseCodes.processSingleCodeFile(results, file);
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
        const dataTrail = new Map();
        movementPointArray.forEach((point, index) => {
          dataTrail.set(index, new DataPoint("", point.x, point.y)); // Assuming x and y properties are present in the point
        });
        this.userList.push(new User(true, pathName, this.getNextColorInList(this.userList.length), dataTrail));
        this.userList = this.sortByName(this.userList);
        this.setTotalTime(movementPointArray);
        this.parseCodes.resetCounters();
        // this.sk.domController.updateCheckboxes("movement");
        this.sk.loop();
      }

    /**
     * NOTE: method follows same format as updateMovement with a few minor differences
     * @param  {PapaParse results Array} parsedConversationFileArray
     */
    updateConversation(parsedConversationFileArray) {
        this.setSpeakerList(parsedConversationFileArray);
        this.speakerList = this.sortByName(this.speakerList);
        this.parseMovement.reProcessAllPointArrays(); // must reprocess movement
        // this.sk.domController.updateCheckboxes("talk");
        this.sk.loop();
    }

    updateCodes(codeName) {
        this.codeList.push(this.createDisplayData(codeName, false, this.COLORGRAY, this.getNextColorInList(this.codeList.length)));
        this.clearMovement();
        this.parseMovement.reProcessAllPointArrays();
        // this.sk.domController.updateCheckboxes("codes");
        this.sk.loop();
    }

    setTotalTime(movementPointArray) {
        const curPathEndTime = Math.floor(movementPointArray[movementPointArray.length - 1].time);
        if (this.totalTimeInSeconds < curPathEndTime) this.totalTimeInSeconds = curPathEndTime; // update global total time, make sure to floor value as integer
    }

    getTotalTimeInSeconds() {
        return this.totalTimeInSeconds;
    }

    setSpeakerList(parsedConversationFileArray) {
        for (const curRow of parsedConversationFileArray) {
            let tempSpeakerList = []; // create/populate temp list to store strings to test from global core.speakerList
            for (const tempSpeaker of this.speakerList) tempSpeakerList.push(tempSpeaker.name);
            // If row is good data, test if core.speakerList already has speaker and if not add speaker
            if (this.coreUtils.conversationRowForType(curRow)) {
                const speaker = this.coreUtils.cleanFileName(curRow[this.coreUtils.headersConversation[1]]); // get cleaned speaker character
                if (!tempSpeakerList.includes(speaker)) this.speakerList.push(this.createDisplayData(speaker, true, this.getNextColorInList(this.speakerList.length), this.COLORGRAY));
            }
        }
    }

    createPath(name, movementPointArray, conversationPointArray) {
        const path = this.createDisplayData(name, true, this.getPathModeColor(name), this.COLORGRAY);
        return {
            name: path.name, // string name
            enabled: path.enabled, // boolean used to indicate if speaker showing in GUI
            color: path.color,
            movement: movementPointArray,
            conversation: conversationPointArray
        }
    }

    createDisplayData(name, enabled, colorPathMode, colorCodeMode) {
        return {
            name, // string name
            enabled, // toggle display in GUI
            color: this.createColorDisplayObject(colorPathMode, colorCodeMode) //
        }
    }

    createColorDisplayObject(pathMode, codeMode) {
        return {
            pathMode,
            codeMode
        }
    }

    /**
     * Organizes retrieval of path color depending on whether conversation file has been loaded
     * @param  {Char} name
     */
    getPathModeColor(name) {
        if (this.sk.arrayIsLoaded(this.speakerList)) return this.setPathModeColorBySpeaker(name);
        else return this.getNextColorInList(this.pathList.length);
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
        } else return this.getNextColorInList(this.speakerList.length + this.getNumPathsWithNoSpeaker());
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

    getNextColorInList(number) {
        return this.COLOR_LIST[number % this.COLOR_LIST.length];
    }

    sortByName(list) {
        return list.sort((a, b) => (a.name > b.name) ? 1 : -1);
      }

    clearAll() {
        this.parseMovement.clear();
        this.parseConversation.clear();
        this.parseCodes.clear();
        this.userList = [];
        this.totalTimeInSeconds = 0;
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