class DomController {

    constructor(sketch) {
        this.sk = sketch;
    }
    /**
     * Parses user inputted floor plan image for processing
     * @param  {PNG, JPG, JPEG File} input
     */
    handleFloorPlanFile(input) {
        this.sk.core.inputFloorPlan.update(URL.createObjectURL(input.files[0]));
        input.value = ''; // reset input value so you can load same file again in browser
    }

    /**
     * Sends user inputted movement files into fileList for processing
     * @param  {.CSV File} input
     */
    handleMovementFiles(input) {
        let fileList = [];
        for (const file of input.files) fileList.push(file);
        this.sk.core.parseMovement.prepFiles(fileList);
        input.value = ''; // reset input value so you can load same file(s) again in browser
    }

    /**
     * Sends file from user input for conversation parsing
     * @param  {File} input
     */
    handleConversationFile(input) {
        this.sk.core.parseConversation.prepFile(input.files[0]);
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

    /**
     * Sends user inputted movement files into fileList for processing
     * @param  {.CSV FileList} input
     */
    handleCodeFiles(input) {
        let fileList = [];
        for (const file of input.files) fileList.push(file);
        this.sk.core.parseCodes.prepFiles(fileList);
        input.value = ''; // reset input value so you can load same file(s) again in browser
    }

    handleClearButton() {
        this.sk.core.clearAll();
        this.clearCurVideo();
        this.sk.loop(); // rerun P5 draw loop
    }

    handleToggle3DButton() {
        this.sk.sketchController.handleToggle3D();
    }

    handleVideoButton() {
        if (this.sk.sketchController.testVideoAndDivAreLoaded()) this.sk.sketchController.toggleVideoShowHide();
    }

    handleHowToButton() {
        let element = document.querySelector('.introContainer');
        if (element.style.display === 'none') element.style.display = 'block';
        else element.style.display = 'none';
    }

    hideIntroMessage() {
        let element = document.querySelector('.introContainer');
        element.style.display = 'none';
    }

    /**
     * Example data format: [String directory, String floorPlan image file, String conversation File, String movement File[], String video platform, video params(see Video Player Interface)]
     */
    handleExampleDropDown() {
        if (this.sk.sketchController.getIsAnimate()) this.sk.sketchController.startEndAnimation(); // reset animation if running
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
        this.hideIntroMessage();
        this.sk.core.clearAll();
        this.clearCurVideo();
        this.sk.loop(); // rerun P5 draw loop
    }

    /**
     * @param  {[String directory, String floorPlan image file, String conversation File, String movement File[], String video platform, video params (see Video Player Interface)]} params
     */
    loadExampleData(params) {
        this.sk.core.clearAll();
        this.hideIntroMessage();
        this.updateVideo(params[4], params[5]);
        this.sk.core.inputFloorPlan.update(params[0] + params[1]);
        this.sk.core.parseConversation.prepExampleFile(params[0], params[2]);
        this.sk.core.parseMovement.prepExampleFiles(params[0], params[3]);
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
        if (this.sk.dataIsLoaded(this.sk.videoPlayer)) { // if there is a video, destroy it
            this.sk.videoPlayer.destroy();
            this.sk.videoPlayer = null;
            this.sk.sketchController.setIsVideoPlay(false);
            this.sk.sketchController.setIsVideoShow(false);
        }
    }

    removeAllElements(elementId) {
        let element = document.getElementById(elementId);
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    updateMainTab(curItem, mainTabId) {
        let parent = document.getElementById(mainTabId); // Get parent tab to append new div and label to
        let label = document.createElement('label'); //  Make label
        let div = document.createElement('input'); // Make checkbox div
        let span = document.createElement('span'); // Make span to hold new checkbox styles
        label.textContent = curItem.name; // set name to text of path
        label.setAttribute('class', 'tab-checkbox');
        div.setAttribute("type", "checkbox");
        // div.name = "sub-group";
        // div.id = "sub-tab-1";
        span.className = "checkmark";

        if (curItem.isShowing) {
            if (this.sk.sketchController.getIsPathColorMode()) span.style.backgroundColor = curItem.color.pathMode;
            else span.style.backgroundColor = curItem.color.codeMode;
            div.checked = true;
        } else {
            span.style.backgroundColor = "";
            //span.style.backgroundColor = "D3D3D3";
            div.checked = false;
        }

        div.addEventListener('change', () => {
            curItem.isShowing = !curItem.isShowing; // update isShowing for path
            if (curItem.isShowing) {
                if (this.sk.sketchController.getIsPathColorMode()) span.style.backgroundColor = curItem.color.pathMode;
                else span.style.backgroundColor = curItem.color.codeMode;
            } else span.style.backgroundColor = "";
            this.sk.loop();
        });
        label.appendChild(div);
        label.appendChild(span);
        parent.appendChild(label);
    }

    reProcessCheckboxMainTabs() {
        this.reProcessCheckboxList(this.sk.core.pathList, "movementMainTab");
        this.reProcessCheckboxList(this.sk.core.speakerList, "conversationMainTab");
        this.reProcessCheckboxList(this.sk.core.codeList, "codesMainTab");
    }

    reProcessCheckboxList(list, elementId) {
        this.removeAllElements(elementId);
        for (const item of list) this.updateMainTab(item, elementId);
    }
}