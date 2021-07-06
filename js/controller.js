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
        //if (sketchController.mode.isVideoShow) sketchController.overVideoButton(); // Turn off video that if showing
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

    handleAnimateButton() {
        sketchController.overAnimateButton();
    }

    handleAlignTalkButton() {
        sketchController.setAlignTalk(!sketchController.mode.isAlignTalk);
    }

    handleAllTalkButton() {
        sketchController.setAllTalk(!sketchController.mode.isAllTalk);
    }

    handleVideoButton() {
        sketchController.overVideoButton();
    }

    handleHowToButton() {
        sketchController.setIntro(!sketchController.mode.isIntro);
    }

    /**
     * Example data format: [String directory, String floorPlan image file, String conversation File, String movement File[], String video platform, video params(see Video Player Interface)]
     */
    handleExampleDropDown() {
        let option = document.getElementById("examples").value;
        if (option === "Load Data") this.showInputBar();
        else this.hideInputBar();
        switch (option) {
            case "Load Data":
                sketchController.loadUserData();
                break;
            case "Example 1":
                sketchController.loadExampleData(['data/example-1/', 'floorplan.png', 'conversation.csv', ['Teacher.csv'], 'Youtube', {
                    videoId: 'Iu0rxb-xkMk'
                }]);
                sketchController.setAllTalk(true); // not essential but setting matches each case differently
                break;
            case "Example 2":
                sketchController.loadExampleData(['data/example-2/', 'floorplan.png', 'conversation.csv', ['Teacher.csv', 'Sean.csv', 'Mei.csv', 'Cassandra.csv', 'Nathan.csv'], 'Youtube', {
                    videoId: 'OJSZCK4GPQY'
                }]);
                sketchController.setAllTalk(false);
                break;
            case "Example 3":
                sketchController.loadExampleData(['data/example-3/', 'floorplan.png', 'conversation.csv', ['Jordan.csv'], 'Youtube', {
                    videoId: 'iiMjfVOj8po'
                }]);
                sketchController.setAllTalk(false);
                break;
            case "Example 4":
                sketchController.loadExampleData(['data/example-4/', 'floorplan.png', 'conversation.csv', ['Lily.csv', 'Jeans.csv', 'Adhir.csv', 'Mae.csv', 'Blake.csv'], 'Youtube', {
                    videoId: 'pWJ3xNk1Zpg'
                }]);
                sketchController.setAllTalk(false);
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
}