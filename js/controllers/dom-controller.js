class DomController {

    constructor(sketch) {
        this.sk = sketch;
    }
    /**
     * Parses user inputted floor plan image for processing
     * @param  {PNG, JPG, JPEG File} input
     */
    handleFloorPlanFile(input) {
        this.sk.core.updateFloorPlan(URL.createObjectURL(input.files[0]));
        input.value = ''; // reset input value so you can load same file again in browser
    }

    /**
     * Sends user inputted movement files into fileList for processing
     * @param  {.CSV File} input
     */
    handleMovementFiles(input) {
        let fileList = [];
        for (const file of input.files) fileList.push(file);
        this.sk.processData.prepMovementFiles(fileList);
        input.value = ''; // reset input value so you can load same file(s) again in browser
    }

    /**
     * Sends file from user input for conversation parsing
     * @param  {File} input
     */
    handleConversationFile(input) {
        this.sk.processData.prepConversationFile(input.files[0]);
        input.value = ''; // reset input value so you can load same file again in browser
    }

    /**
     * Parses user inputted video file for processing
     * @param  {.MP4 File} input
     */
    handleVideoFile(input) {
        const fileLocation = URL.createObjectURL(input.files[0]);
        this.updateVideo('File', {
            fileName: fileLocation
        });
        input.value = ''; // reset input value so you can load same file again in browser
    }

    handleClearButton() {
        this.sk.core.clearAllData();
        this.clearCurVideo();
        this.sk.sketchController.startLoop(); // rerun P5 draw loop
    }

    handleAnimateButton() {
        this.sk.sketchController.updateAnimationCounter();
        this.sk.sketchController.startLoop();
    }

    handleAlignTalkButton() {
        this.sk.sketchController.setIsAlignTalk(!this.sk.sketchController.mode.isAlignTalk);
        this.sk.sketchController.startLoop();

    }

    handleAllTalkButton() {
        this.sk.sketchController.setIsAllTalk(!this.sk.sketchController.mode.isAllTalk);
        this.sk.sketchController.startLoop();

    }

    handleVideoButton() {
        if (this.sk.sketchController.testVideoAndDivAreLoaded()) this.sk.sketchController.toggleVideoShowHide();
    }

    handleHowToButton() {
        this.sk.sketchController.setIsIntro(!this.sk.sketchController.mode.isIntro);
        this.sk.sketchController.startLoop();
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
                this.loadExampleData(['data/example-1/', 'floorplan.png', 'conversation.csv', ['Jordan.csv'], 'Youtube', {
                    videoId: 'iiMjfVOj8po'
                }]);
                this.sk.sketchController.setIsAllTalk(false);
                break;
            case "Example 2":
                this.loadExampleData(['data/example-2/', 'floorplan.png', 'conversation.csv', ['Lily.csv', 'Jeans.csv', 'Adhir.csv', 'Mae.csv', 'Blake.csv'], 'Youtube', {
                    videoId: 'pWJ3xNk1Zpg'
                }]);
                this.sk.sketchController.setIsAllTalk(false);
                break;
            case "Example 3":
                this.loadExampleData(['data/example-3/', 'floorplan.png', 'conversation.csv', ['Teacher.csv'], 'Youtube', {
                    videoId: 'Iu0rxb-xkMk'
                }]);
                this.sk.sketchController.setIsAllTalk(true); // not essential but setting matches each case differently
                break;
            case "Example 4":
                this.loadExampleData(['data/example-4/', 'floorplan.png', 'conversation.csv', ['Teacher.csv', 'Sean.csv', 'Mei.csv', 'Cassandra.csv', 'Nathan.csv'], 'Youtube', {
                    videoId: 'OJSZCK4GPQY'
                }]);
                this.sk.sketchController.setIsAllTalk(false);
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
        this.sk.sketchController.setIsIntro(false); // Hide intro msg if showing
        this.sk.core.clearAllData();
        this.clearCurVideo();
        this.sk.sketchController.startLoop(); // rerun P5 draw loop
    }

    /**
     * @param  {[String directory, String floorPlan image file, String conversation File, String movement File[], String video platform, video params (see Video Player Interface)]} params
     */
    loadExampleData(params) {
        this.sk.sketchController.setIsIntro(false); // Hide intro msg if showing
        this.updateVideo(params[4], params[5]);
        this.sk.core.updateFloorPlan(params[0] + params[1]);
        this.sk.processData.prepExampleConversationFile(params[0], params[2]);
        this.sk.processData.prepExampleMovementFiles(params[0], params[3]);
    }

    /**
     * Replaces existing videoPlayer object with new VideoPlayer object (YouTube or P5FilePlayer)
     * @param  {String} platform
     * @param  {VideoPlayer Specific Params} params
     */
    updateVideo(platform, params) {
        this.clearCurVideo();
        const videoWidth = this.sk.width / 5;
        const videoHeight = this.sk.width / 6;
        switch (platform) {
            case "Youtube":
                this.sk.videoPlayer = new YoutubePlayer(this.sk, params, videoWidth, videoHeight);
                break;
            case "File":
                this.sk.videoPlayer = new P5FilePlayer(this.sk, params, videoWidth, videoHeight);
                break;
        }
    }

    clearCurVideo() {
        if (this.sk.testData.dataIsLoaded(this.sk.videoPlayer)) { // if there is a video, destroy it
            this.sk.videoPlayer.destroy();
            this.sk.videoPlayer = null;
            this.sk.sketchController.setIsVideoPlay(false);
            this.sk.sketchController.setIsVideoShow(false);
        }
    }
}