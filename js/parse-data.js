/**
 * Parses user inputted floor plan image for processing
 * @param  {PNG, JPG, JPEG Image File} input
 */
function parseInputFloorPlanFile(input) {
    processFloorPlan(URL.createObjectURL(input.files[0]));
    input.value = ''; // reset input value so you can load same file again in browser
}

/**
 * Converts and sends user inputted movement files into fileList for processing
 * @param  {.CSV File} input
 */
function parseInputMovementFiles(input) {
    let fileList = [];
    for (let i = 0; i < input.files.length; i++) fileList.push(input.files[i]);
    parseMovementFiles(fileList);
    input.value = ''; // reset input value so you can load same file(s) again in browser
}
/**
 * Parses each movement file and sends for additional testing and processing
 * NOTE: boolean updateMovementData sets true to trigger clearing of current movement file data
 * @param  {File[]} fileList
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

// Tests movement file formatting
function testMovementFile(results, file) {
    console.log("Parsing complete:", results, file);
    if (testMovementFileData(results.data, results.meta.fields)) {
        movementFileResults.push([results, file]);
        processMovementFile(results, file);
    }
}

/**
 * Gets single file format from input and sends for conversation parsing
 * @param  {} input
 */
function parseInputConversationFile(input) {
    parseConversationFile(input.files[0]); // parse converted file
    input.value = ''; // reset input value so you can load same file again in browser
}

/**
 * Parses single conversation file using Papa.parse library
 * NOTE: testConversationFile is called when parsing is complete
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

function testConversationFile(results, file) {
    console.log("Parsing complete:", results, file);
    if (testConversationFileData(results.data, results.meta.fields)) {
        conversationFileResults = results.data; // set to new array of keyed values
        updateSpeakerList();
        speakerList.sort((a, b) => (a.name > b.name) ? 1 : -1); // sort list so it appears nicely in GUI matching paths array
        // Must reprocess movement files
        for (let i = 0; i < movementFileResults.length; i++) processMovementFile(movementFileResults[i][0], movementFileResults[i][1]);
    }
}

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

// ***** MOVEMENT FILE TESTS *****
// Test if there is data in file, if it has correct movement file headers, and if at leasat one row of values is of correct type for each movement file
function testMovementFileData(data, meta) {
    return data.length > 1 && testMovementFileHeaders(meta) && testMovementFileRowsForType(data);
}

// Tests if correct movement file headers
function testMovementFileHeaders(meta) {
    return meta.includes(movementHeaders[0]) && meta.includes(movementHeaders[1]) && meta.includes(movementHeaders[2]);
}

// Loop through data and return true on first row that has all data typed as numbers or false if no rows are properly typed
function testMovementFileRowsForType(data) {
    for (let i = 0; i < data.length; i++) {
        if (typeof data[i][movementHeaders[0]] === 'number' && typeof data[i][movementHeaders[1]] === 'number' && typeof data[i][movementHeaders[2]] === 'number') return true;
    }
    return false;
}


// ***** CONVERSATION FILE TESTS *****
// Tests if there is data in file, if it has correct conversation file headers, and if at least 1 row has good data
function testConversationFileData(data, meta) {
    return data.length > 1 && testConversationFileHeaders(meta) && testConversationFileRowsForType(data);
}

// Tests if correct file headers for conversation
function testConversationFileHeaders(meta) {
    return meta.includes(conversationHeaders[0]) && meta.includes(conversationHeaders[1]) && meta.includes(conversationHeaders[2]);
}

// Loop through data and return true on first row with time is number and speaker is string and talk turn is not null or undefined
function testConversationFileRowsForType(data) {
    for (let i = 0; i < data.length; i++) {
        if (typeof data[i][conversationHeaders[0]] === 'number' && typeof data[i][conversationHeaders[1]] === 'string' && data[i][conversationHeaders[2]] !== null && data[i][conversationHeaders[2]] !== undefined) return true;
    }
    return false;
}