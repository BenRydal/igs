class DomController {

    constructor(sketch) {
        this.sketch = sketch;
    }
    /**
     * Parses user inputted floor plan image for processing
     * @param  {PNG, JPG, JPEG File} input
     */
    handleFloorPlanFile(input) {
        this.sketch.sketchController.overLoadFloorPlanButton(URL.createObjectURL(input.files[0]));
        input.value = ''; // reset input value so you can load same file again in browser
    }

    /**
     * Sends user inputted movement files into fileList for processing
     * @param  {.CSV File} input
     */
    handleMovementFiles(input) {
        let fileList = [];
        for (const file of input.files) fileList.push(file);
        this.sketch.sketchController.overLoadMovementButton(fileList);
        input.value = ''; // reset input value so you can load same file(s) again in browser
    }

    /**
     * Sends file from user input for conversation parsing
     * @param  {File} input
     */
    handleConversationFile(input) {
        this.sketch.sketchController.overLoadConversationButton(input.files[0]);
        input.value = ''; // reset input value so you can load same file again in browser
    }

    /**
     * Parses user inputted video file for processing
     * @param  {.MP4 File} input
     */
    handleVideoFile(input) {
        this.sketch.sketchController.overLoadVideoButton(URL.createObjectURL(input.files[0]))
        input.value = ''; // reset input value so you can load same file again in browser
    }

    handleClearButton() {
        this.sketch.sketchController.overClearButton();
    }

    handleAnimateButton() {
        this.sketch.sketchController.overAnimateButton();
    }

    handleAlignTalkButton() {
        this.sketch.sketchController.setAlignTalk(!this.sketch.sketchController.mode.isAlignTalk);
    }

    handleAllTalkButton() {
        this.sketch.sketchController.setAllTalk(!this.sketch.sketchController.mode.isAllTalk);
    }

    handleVideoButton() {
        this.sketch.sketchController.overVideoButton();
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
                this.sketch.sketchController.loadUserData();
                break;
            case "Example 1":
                this.sketch.sketchController.loadExampleData(['data/example-1/', 'floorplan.png', 'conversation.csv', ['Teacher.csv'], 'Youtube', {
                    videoId: 'Iu0rxb-xkMk'
                }]);
                this.sketch.sketchController.setAllTalk(true); // not essential but setting matches each case differently
                break;
            case "Example 2":
                this.sketch.sketchController.loadExampleData(['data/example-2/', 'floorplan.png', 'conversation.csv', ['Teacher.csv', 'Sean.csv', 'Mei.csv', 'Cassandra.csv', 'Nathan.csv'], 'Youtube', {
                    videoId: 'OJSZCK4GPQY'
                }]);
                this.sketch.sketchController.setAllTalk(false);
                break;
            case "Example 3":
                this.sketch.sketchController.loadExampleData(['data/example-3/', 'floorplan.png', 'conversation.csv', ['Jordan.csv'], 'Youtube', {
                    videoId: 'iiMjfVOj8po'
                }]);
                this.sketch.sketchController.setAllTalk(false);
                break;
            case "Example 4":
                this.sketch.sketchController.loadExampleData(['data/example-4/', 'floorplan.png', 'conversation.csv', ['Lily.csv', 'Jeans.csv', 'Adhir.csv', 'Mae.csv', 'Blake.csv'], 'Youtube', {
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
}