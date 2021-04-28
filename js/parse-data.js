// ***** FLOOR PLAN INPUT METHODS *****

/**
 * Parses user inputted floor plan image for processing
 * @param  {PNG, JPG, JPEG File} input
 */
function parseInputFloorPlanFile(input) {
    processFloorPlan(URL.createObjectURL(input.files[0]));
    input.value = ''; // reset input value so you can load same file again in browser
}

// ***** MOVEMENT FILE INPUT METHODS *****

/**
 * Sends user inputted movement files into fileList for processing
 * @param  {.CSV File} input
 */
function parseInputMovementFiles(input) {
    let fileList = [];
    for (let i = 0; i < input.files.length; i++) fileList.push(input.files[i]);
    parseMovementFiles(fileList);
    input.value = ''; // reset input value so you can load same file(s) again in browser
}
/**
 * Clears exisiting movement data
 * Parses each movement file and sends for additional testing and processing
 * 
 * @param  {.CSV File[]} fileList
 */
function parseMovementFiles(fileList) {
    clearMovementData(); // clear exisiting movement data
    for (let i = 0; i < fileList.length; i++) {
        Papa.parse(fileList[i], {
            complete: testMovementFile,
            header: true,
            dynamicTyping: true,
        });
    }
}

/** 
 * Organizes testing of parsed movement file
 * If file passes, add data to global movementFileResults and process movement file
 * @param  {PapaParse Results []} results
 * @param  {File} file
 */
function testMovementFile(results, file) {
    console.log("Parsing complete:", results, file);
    // Test if file has data, file headers, and at least one row of correctly typed data
    if (results.data.length > 1 && testMovementFileHeaders(results.meta.fields) && testMovementFileRowsForType(results.data)) {
        const pathName = file.name.charAt(0).toUpperCase(); // name of path, also used to test if associated speaker in conversation file
        movementFileResults.push([results, pathName]);
        processMovementFile(results, pathName); // pass first letter and make it uppercase. Will represent name of path
    }
}

/**
 * Tests if PapaParse meta results array includes correct headers for movement
 * @param  {PapaParse results.meta.fields} meta
 */
function testMovementFileHeaders(meta) {
    return meta.includes(movementHeaders[0]) && meta.includes(movementHeaders[1]) && meta.includes(movementHeaders[2]);
}

/**
 * Tests if at least one row of correctly typed data in PapaParse data array
 * Returns true on first row of PapaParse data array that has all correctly typed data for movement headers
 * @param  {PapaParse results.data []} data
 */
function testMovementFileRowsForType(data) {
    for (let i = 0; i < data.length; i++) {
        if (typeof data[i][movementHeaders[0]] === 'number' && typeof data[i][movementHeaders[1]] === 'number' && typeof data[i][movementHeaders[2]] === 'number') return true;
    }
    return false;
}

// ***** CONVERSATION FILE INPUT METHODS *****

/**
 * Sends file from user input for conversation parsing
 * @param  {File} input
 */
function parseInputConversationFile(input) {
    parseConversationFile(input.files[0]); // parse converted file
    input.value = ''; // reset input value so you can load same file again in browser
}

/**
 * Clears exisiting conversation data
 * Parses single conversation file using PapaParse library and sends for additional testing and processing
 * @param  {.CSV File} file
 */
function parseConversationFile(file) {
    clearConversationData(); // clear exisiting conversation data
    Papa.parse(file, {
        complete: testConversationFile,
        header: true,
        dynamicTyping: true,
    });
}

/** 
 * Organizes testing of parsed conversation file
 * If file passes, add data to global conversationFileResults and update additional processing methods
 * @param  {PapaParse Results []} results
 * @param  {File} file
 */
function testConversationFile(results, file) {
    console.log("Parsing complete:", results, file);
    // Test if file has data, file headers, and at least one row of correctly typed data
    if (results.data.length > 1 && testConversationFileHeaders(results.meta.fields) && testConversationFileRowsForType(results.data)) {
        conversationFileResults = results.data; // set to new array of keyed values
        updateSpeakerList();
        speakerList.sort((a, b) => (a.name > b.name) ? 1 : -1); // sort list so it appears nicely in GUI matching paths array
        // Must reprocess existing movement files
        for (let i = 0; i < movementFileResults.length; i++) processMovementFile(movementFileResults[i][0], movementFileResults[i][1]);
    }
}

/**
 * Tests if PapaParse meta results array includes correct headers for conversation
 * @param  {PapaParse results.meta.fields} meta
 */
function testConversationFileHeaders(meta) {
    return meta.includes(conversationHeaders[0]) && meta.includes(conversationHeaders[1]) && meta.includes(conversationHeaders[2]);
}

/**
 * Tests if at least one row of correctly typed data in PapaParse data array
 * Returns true on first row of PapaParse data array that has all correctly typed data for conversation headers
 * @param  {PapaParse results.data []} data
 */
function testConversationFileRowsForType(data) {
    for (let i = 0; i < data.length; i++) {
        if (typeof data[i][conversationHeaders[0]] === 'number' && typeof data[i][conversationHeaders[1]] === 'string' && data[i][conversationHeaders[2]] !== null && data[i][conversationHeaders[2]] !== undefined) return true;
    }
    return false;
}


// ***** VIDEO FILE INPUT METHODS *****

/**
 * Parses user inputted video file for processing
 * @param  {.MP4 File} input
 */
function parseInputVideoFile(input) {
    if (videoIsShowing) overVideoButton(); // Turn off video that if showing
    let file = input.files[0];
    input.value = ''; // reset input value so you can load same file again in browser
    let fileLocation = URL.createObjectURL(file);
    processVideo('File', {
        fileName: fileLocation
    });
}

// ***** CLEAR DATA METHODS *****

function clearAllData() {
    if (videoPlayer !== undefined) videoPlayer.destroy(); // if there is a video, destroy it
    floorPlan = undefined;
    speakerList = [];
    paths = [];
    movementFileResults = [];
    conversationFileResults = [];
    paths = [];
    totalTimeInSeconds = 0; // reset total time
    updateMovementData = false; // reset
}

function clearConversationData() {
    conversationFileResults = [];
    speakerList = [];
    paths = [];
}

function clearMovementData() {
    movementFileResults = [];
    paths = [];
    totalTimeInSeconds = 0; // reset total time
    updateMovementData = false; // reset
}