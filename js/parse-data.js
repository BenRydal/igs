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
        core.clearMovementData(); // clear existing movement data
        for (let i = 0; i < fileList.length; i++) {
            Papa.parse(fileList[i], {
                complete: function (results, f) {
                    console.log("Parsing complete:", results, f);
                    loop(); // rerun P5 draw loop
                    if (testData.movementResults(results)) processData.processMovement(results, f);
                    else alert("Error loading movement file. Please make sure your file is a .CSV file formatted with column headers: " + CSVHEADERS_MOVEMENT.toString());
                },
                header: true,
                dynamicTyping: true,
            });
        }
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
        core.clearConversationData(); // clear existing conversation data
        Papa.parse(file, {
            complete: function (results, f) {
                console.log("Parsing complete:", results, f);
                loop(); // rerun P5 draw loop
                if (testData.conversationResults(results)) processData.processConversation(results);
                else alert("Error loading conversation file. Please make sure your file is a .CSV file formatted with column headers: " + CSVHEADERS_CONVERSATION.toString());
            },
            header: true,
            dynamicTyping: true,
        });
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
}