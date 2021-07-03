class Controller {

    /**
     * Parses user inputted floor plan image for processing
     * @param  {PNG, JPG, JPEG File} input
     */
    handleFloorPlanFile(input) {
        processData.processFloorPlan(URL.createObjectURL(input.files[0]));
        input.value = ''; // reset input value so you can load same file again in browser
    }

    /**
     * Sends user inputted movement files into fileList for processing
     * @param  {.CSV File} input
     */
    handleMovementFiles(input) {
        let fileList = [];
        for (let i = 0; i < input.files.length; i++) fileList.push(input.files[i]);
        this.parseMovementFiles(fileList);
        input.value = ''; // reset input value so you can load same file(s) again in browser
    }

    /**
     * Clears existing movement data and parses each movement file and sends for additional testing and processing
     * @param  {.CSV File[]} fileList
     */
    parseMovementFiles(fileList, callback) {
        core.clearMovementData(); // clear existing movement data
        for (const fileToParse of fileList) {
            Papa.parse(fileToParse, {
                complete: function (results, file) {
                    console.log("Parsing complete:", results, file);
                    loop(); // rerun P5 draw loop
                    if (testData.movementResults(results)) processData.processMovement(results, file);
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
    handleConversationFile(input) {
        this.parseConversationFile(input.files[0]); // parse converted file
        input.value = ''; // reset input value so you can load same file again in browser
    }

    /**
     * Clears existing conversation data and parses single conversation file using PapaParse library and sends for additional testing and processing
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
    handleVideoFile(input) {
        if (core.isModeVideoShowing) handlers.overVideoButton(); // Turn off video that if showing
        let file = input.files[0];
        input.value = ''; // reset input value so you can load same file again in browser
        let fileLocation = URL.createObjectURL(file);
        processData.processVideo('File', {
            fileName: fileLocation
        });
    }

    handleClearButton() {
        core.clearAllData()
    }

    /**
     * Example data format: [String directory, String floorPlan image file, String conversation File, String movement File[], String video platform, video params(see Video Player Interface)]
     */
    handleExampleDropDown() {
        let option = document.getElementById("examples").value;
        if (core.isModeVideoShowing) handlers.overVideoButton(); // Turn off video that if showing
        core.isModeIntro = false; // Hide intro msg if showing
        switch (option) {
            case "Load Data":
                this.loadUserData();
                break;
            case "Example 1":
                this.loadExample(['data/example-1/', 'floorplan.png', 'conversation.csv', ['Teacher.csv'], 'Youtube', {
                    videoId: 'Iu0rxb-xkMk'
                }]);
                break;
            case "Example 2":
                this.loadExample(['data/example-2/', 'floorplan.png', 'conversation.csv', ['Teacher.csv', 'Sean.csv', 'Mei.csv', 'Cassandra.csv', 'Nathan.csv'], 'Youtube', {
                    videoId: 'OJSZCK4GPQY'
                }]);
                core.isModeAllTalkOnPath = false; // not necessary, but fits example nicely
                break;
            case "Example 3":
                this.loadExample(['data/example-3/', 'floorplan.png', 'conversation.csv', ['Jordan.csv'], 'Youtube', {
                    videoId: 'iiMjfVOj8po'
                }]);
                core.isModeAllTalkOnPath = false; // not necessary, but fits example nicely
                break;
            case "Example 4":
                this.loadExample(['data/example-4/', 'floorplan.png', 'conversation.csv', ['Lily.csv', 'Jeans.csv', 'Adhir.csv', 'Mae.csv', 'Blake.csv'], 'Youtube', {
                    videoId: 'pWJ3xNk1Zpg'
                }]);
                core.isModeAllTalkOnPath = false; // not necessary, but fits example nicely
                break;
        }
    }

    showInputBar() {
        let element = document.querySelector('.inputBar');
        element.style.display = 'block';
    }

    hideInputBar() {
        let element = document.querySelector('.inputBar');
        element.style.display = 'none';
    }


    loadUserData() {
        core.clearAllData();
        this.showInputBar();
        loop(); // rerun P5 draw loop
    }
    /**
     * Handles asynchronous loading of example data from a selected example array of data
     * @param  {[String directory, String floorPlan image file, String conversation File, String movement File[], String video platform, video params (see Video Player Interface)]} params
     */
    async loadExample(params) {
        this.hideInputBar();
        processData.processVideo(params[4], params[5]);
        processData.processFloorPlan(params[0] + params[1]);
        // Process conversation then movement files
        await this.getExampleConversationFile(params[0], params[2]).then(controller.parseConversationFile);
        this.getExampleMovementFiles(params[0], params[3]).then(controller.parseMovementFiles);
    }

    /**
     * Handles async loading of conversation file
     * NOTE: folder and filename are separated for convenience later in program
     * @param  {String} folder
     * @param  {String} fileName
     */
    async getExampleConversationFile(folder, fileName) {
        let response = await fetch(new Request(folder + fileName));
        let buffer = await response.arrayBuffer();
        return new File([buffer], fileName, {
            type: "text/csv",
        });
    }
    /**
     * Handles async loading of movement file
     * NOTE: folder and filename are separated for convenience later in program
     * @param  {String} folder
     * @param  {String} fileNames
     */
    async getExampleMovementFiles(folder, fileNames) {
        let fileList = [];
        for (let i = 0; i < fileNames.length; i++) {
            let response = await fetch(new Request(folder + fileNames[i]));
            let buffer = await response.arrayBuffer();
            fileList.push(new File([buffer], fileNames[i], {
                type: "text/csv",
            }));
        }
        return fileList;
    }
}