class DomController {

    constructor(sketch) {
        this.sketch = sketch;
    }
    /**
     * Parses user inputted floor plan image for processing
     * @param  {PNG, JPG, JPEG File} input
     */
    handleFloorPlanFile(input) {
        this.sketch.core.updateFloorPlan(URL.createObjectURL(input.files[0]));
        input.value = ''; // reset input value so you can load same file again in browser
    }

    /**
     * Sends user inputted movement files into fileList for processing
     * @param  {.CSV File} input
     */
    handleMovementFiles(input) {
        let fileList = [];
        for (const file of input.files) fileList.push(file);
        this.sketch.processData.prepMovementFiles(fileList);
        input.value = ''; // reset input value so you can load same file(s) again in browser
    }

    /**
     * Sends file from user input for conversation parsing
     * @param  {File} input
     */
    handleConversationFile(input) {
        this.sketch.processData.prepConversationFile(input.files[0]);
        input.value = ''; // reset input value so you can load same file again in browser
    }

    /**
     * Parses user inputted video file for processing
     * @param  {.MP4 File} input
     */
    handleVideoFile(input) {
        const fileLocation = URL.createObjectURL(input.files[0]);
        this.sketch.core.updateVideo('File', {
            fileName: fileLocation
        });
        input.value = ''; // reset input value so you can load same file again in browser
    }

    handleClearButton() {
        this.sketch.core.clearAllData();
    }

    handleAnimateButton() {
        this.sketch.sketchController.updateAnimationCounter();
    }

    handleAlignTalkButton() {
        this.sketch.sketchController.setAlignTalk(!this.sketch.sketchController.mode.isAlignTalk);
    }

    handleAllTalkButton() {
        this.sketch.sketchController.setAllTalk(!this.sketch.sketchController.mode.isAllTalk);
    }

    handleVideoButton() {
        if (testData.dataIsLoaded(this.sketch.core.videoPlayer)) this.sketch.sketchController.toggleVideoShowHide();
    }

    handleHowToButton() {
        this.sketch.sketchController.setIntro(!this.sketch.sketchController.mode.isIntro);
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
                this.loadUserData();
                break;
            case "Example 1":
                this.loadExampleData(['data/example-1/', 'floorplan.png', 'conversation.csv', ['Teacher.csv'], 'Youtube', {
                    videoId: 'Iu0rxb-xkMk'
                }]);
                this.sketch.sketchController.setAllTalk(true); // not essential but setting matches each case differently
                break;
            case "Example 2":
                this.loadExampleData(['data/example-2/', 'floorplan.png', 'conversation.csv', ['Teacher.csv', 'Sean.csv', 'Mei.csv', 'Cassandra.csv', 'Nathan.csv'], 'Youtube', {
                    videoId: 'OJSZCK4GPQY'
                }]);
                this.sketch.sketchController.setAllTalk(false);
                break;
            case "Example 3":
                this.loadExampleData(['data/example-3/', 'floorplan.png', 'conversation.csv', ['Jordan.csv'], 'Youtube', {
                    videoId: 'iiMjfVOj8po'
                }]);
                this.sketch.sketchController.setAllTalk(false);
                break;
            case "Example 4":
                this.loadExampleData(['data/example-4/', 'floorplan.png', 'conversation.csv', ['Lily.csv', 'Jeans.csv', 'Adhir.csv', 'Mae.csv', 'Blake.csv'], 'Youtube', {
                    videoId: 'pWJ3xNk1Zpg'
                }]);
                this.sketch.sketchController.setAllTalk(false);
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
        this.sketch.sketchController.setIntro(false); // Hide intro msg if showing
        this.sketch.core.clearAllData();
    }

    /**
     * @param  {[String directory, String floorPlan image file, String conversation File, String movement File[], String video platform, video params (see Video Player Interface)]} params
     */
    loadExampleData(params) {
        this.sketch.sketchController.setIntro(false); // Hide intro msg if showing
        this.sketch.core.updateVideo(params[4], params[5]);
        this.sketch.core.updateFloorPlan(params[0] + params[1]);
        this.sketch.processData.prepExampleConversationFile(params[0], params[2]);
        this.sketch.processData.prepExampleMovementFiles(params[0], params[3]);
    }
}