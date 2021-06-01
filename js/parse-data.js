// TODO: Deal with "this" in parseData/other classes
// TEMP: added parseData. for this here
class ParseData {

    /**
     * Parses user inputted floor plan image for processing
     * @param  {PNG, JPG, JPEG File} input
     */
    parseFloorPlanFile(input) {
        processData.processFloorPlan(URL.createObjectURL(input.files[0]));
        input.value = ''; // reset input value so you can load same file again in browser
    }

    /**
     * Sends user inputted movement files into fileList for processing
     * @param  {.CSV File} input
     */
    organizeInputMovementFiles(input) {
        let fileList = [];
        for (let i = 0; i < input.files.length; i++) fileList.push(input.files[i]);
        this.parseMovementFiles(fileList);
        input.value = ''; // reset input value so you can load same file(s) again in browser
    }

    /**
     * Clears existing movement data
     * Parses each movement file and sends for additional testing and processing
     * @param  {.CSV File[]} fileList
     */
    parseMovementFiles(fileList) {
        parseData.clearMovementData(); // clear existing movement data
        for (let i = 0; i < fileList.length; i++) {
            Papa.parse(fileList[i], {
                complete: parseData.prepareMovementFile,
                header: true,
                dynamicTyping: true,
            });
        }
    }

    /** 
     * Organizes testing of parsed movement file
     * If file passes, process movement file, update core.paths [] and add data to global core.movementFileResults
     * @param  {PapaParse Results []} results
     * @param  {File} file
     */
    prepareMovementFile(results, file) {
        console.log("Parsing complete:", results, file);
        // Test if file has data, file headers, and at least one row of correctly typed data
        if (results.data.length > 1 && testData.movementHeaders(results.meta.fields) && testData.movementRowsForType(results.data)) {
            const pathName = file.name.charAt(0).toUpperCase(); // get name of path, also used to test if associated speaker in conversation file
            const [movement, conversation] = processData.processMovementFile(results); //
            processData.updatePaths(pathName, movement, conversation);
            core.movementFileResults.push([results, pathName]); // add results and pathName to global []
        } else alert("Error loading movement file. Please make sure your file is a .CSV file formatted with column headers: " + movementHeaders.toString());
    }

    /**
     * Sends file from user input for conversation parsing
     * @param  {File} input
     */
    organizeInputConversationFile(input) {
        this.parseConversationFile(input.files[0]); // parse converted file
        input.value = ''; // reset input value so you can load same file again in browser
    }

    /**
     * Clears exisiting conversation data
     * Parses single conversation file using PapaParse library and sends for additional testing and processing
     * @param  {.CSV File} file
     */
    parseConversationFile(file) {
        parseData.clearConversationData(); // clear existing conversation data
        Papa.parse(file, {
            complete: parseData.prepareConversationFile,
            header: true,
            dynamicTyping: true,
        });
    }

    /** 
     * Organizes testing of parsed conversation file
     * If file passes, add data to global core.conversationFileResults, update global core.speakerList [], sort the array
     * And re process exisiting movement files
     * @param  {PapaParse Results []} results
     * @param  {File} file
     */
    prepareConversationFile(results, file) {
        console.log("Parsing complete:", results, file);
        // Test if file has data, file headers, and at least one row of correctly typed data
        if (results.data.length > 1 && testData.conversationHeaders(results.meta.fields) && testData.conversationRowsForType(results.data)) {
            core.conversationFileResults = results.data; // set to new array of keyed values
            processData.updateSpeakerList();
            core.speakerList.sort((a, b) => (a.name > b.name) ? 1 : -1); // sort list so it appears nicely in GUI matching core.paths array
            // Must reprocess existing movement files
            for (let i = 0; i < core.movementFileResults.length; i++) {
                const [movement, conversation] = processData.processMovementFile(core.movementFileResults[i][0]); // Reprocess movement file results
                processData.updatePaths(core.movementFileResults[i][1], movement, conversation); // Pass movement file pathname and reprocessed movement file results to updatepaths
            }
        } else alert("Error loading conversation file. Please make sure your file is a .CSV file formatted with column headers: " + conversationHeaders.toString());
    }

    /**
     * Parses user inputted video file for processing
     * @param  {.MP4 File} input
     */
    parseVideoFile(input) {
        if (core.isModeVideoShowing) handlers.overVideoButton(); // Turn off video that if showing
        let file = input.files[0];
        input.value = ''; // reset input value so you can load same file again in browser
        let fileLocation = URL.createObjectURL(file);
        processData.processVideo('File', {
            fileName: fileLocation
        });
    }

    clearAllData() {
        if (dataIsLoaded(videoPlayer)) {
            if (core.isModeVideoShowing) handlers.overVideoButton(); // Turn off video before destroying it if showing
            videoPlayer.destroy(); // if there is a video, destroy it
            videoPlayer = null; // set videoPlayer to null
        }
        core.floorPlan = undefined;
        core.speakerList = [];
        core.paths = [];
        core.movementFileResults = [];
        core.conversationFileResults = [];
        core.paths = [];
        core.totalTimeInSeconds = 0; // reset total time
    }

    clearConversationData() {
        core.conversationFileResults = [];
        core.speakerList = [];
        core.paths = [];
    }

    clearMovementData() {
        core.movementFileResults = [];
        core.paths = [];
        core.totalTimeInSeconds = 0; // reset total time
    }
}