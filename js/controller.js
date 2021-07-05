class Controller {

    /**
     * Parses user inputted floor plan image for processing
     * @param  {PNG, JPG, JPEG File} input
     */
    handleFloorPlanFile(input) {
        core.updateFloorPlan(URL.createObjectURL(input.files[0]));
        input.value = ''; // reset input value so you can load same file again in browser
    }

    /**
     * Sends user inputted movement files into fileList for processing
     * @param  {.CSV File} input
     */
    handleMovementFiles(input) {
        let fileList = [];
        for (const file of input.files) fileList.push(file);
        processData.parseMovementFiles(fileList);
        input.value = ''; // reset input value so you can load same file(s) again in browser
    }

    /**
     * Sends file from user input for conversation parsing
     * @param  {File} input
     */
    handleConversationFile(input) {
        processData.parseConversationFile(input.files[0]); // parse converted file
        input.value = ''; // reset input value so you can load same file again in browser
    }

    /**
     * Parses user inputted video file for processing
     * @param  {.MP4 File} input
     */
    handleVideoFile(input) {
        if (isModeVideoShowing) keys.overVideoButton(); // Turn off video that if showing
        let file = input.files[0];
        input.value = ''; // reset input value so you can load same file again in browser
        let fileLocation = URL.createObjectURL(file);
        core.updateVideo('File', {
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
        if (isModeVideoShowing) keys.overVideoButton(); // Turn off video that if showing
        isModeIntro = false; // Hide intro msg if showing
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
                isModeAllTalkOnPath = false; // not necessary, but fits example nicely
                break;
            case "Example 3":
                this.loadExample(['data/example-3/', 'floorplan.png', 'conversation.csv', ['Jordan.csv'], 'Youtube', {
                    videoId: 'iiMjfVOj8po'
                }]);
                isModeAllTalkOnPath = false; // not necessary, but fits example nicely
                break;
            case "Example 4":
                this.loadExample(['data/example-4/', 'floorplan.png', 'conversation.csv', ['Lily.csv', 'Jeans.csv', 'Adhir.csv', 'Mae.csv', 'Blake.csv'], 'Youtube', {
                    videoId: 'pWJ3xNk1Zpg'
                }]);
                isModeAllTalkOnPath = false; // not necessary, but fits example nicely
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
        core.updateVideo(params[4], params[5]);
        core.updateFloorPlan(params[0] + params[1]);
        // Process conversation then movement files
        await this.getExampleConversationFile(params[0], params[2]).then(processData.parseConversationFile);
        this.getExampleMovementFiles(params[0], params[3]).then(processData.parseMovementFiles);
    }

    /**
     * Handles async loading of conversation file
     * NOTE: folder and filename are separated for convenience later in program
     * @param  {String} folder
     * @param  {String} fileName
     */
    async getExampleConversationFile(folder, fileName) {
        const response = await fetch(new Request(folder + fileName));
        const buffer = await response.arrayBuffer();
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
        for (const name of fileNames) {
            const response = await fetch(new Request(folder + name));
            const buffer = await response.arrayBuffer();
            fileList.push(new File([buffer], name, {
                type: "text/csv",
            }));
        }
        return fileList;
    }
}