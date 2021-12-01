class DomController {

    constructor(sketch) {
        this.sk = sketch;
    }

    /**
     * @param  {PNG/JPG/JPEG, CSV, MP4 Array} input
     */
    handleLoadFileButton(input) {
        for (const file of input.files) this.testFileTypeForProcessing(file);
        input.value = ''; // reset input value so you can load same file(s) again in browser
    }

    testFileTypeForProcessing(file) {
        if (file.type === "text/csv") this.parseCSVFile(file);
        else if (file.type === "image/png" || file.type === "image/jpg" || file.type === "image/jpeg") this.sk.inputFloorPlan.update(URL.createObjectURL(file));
        else if (file.type === "video/mp4") this.prepVideoFromFile(URL.createObjectURL(file));
        else alert("Error loading file. Please make sure your file is an accepted format"); // this should not be possible due to HTML5 accept for file inputs, but in case
    }

    parseCSVFile(fileToParse) {
        Papa.parse(fileToParse, {
            complete: (results, file) => {
                console.log("Parsing complete:", results, file);
                this.sk.core.testParsedResultsForProcessing(results, file);
            },
            error: (error, file) => {
                alert("Parsing error with one of your CSV file. Please make sure your file is formatted correctly as a .CSV");
                console.log(error, file);
            },
            header: true,
            dynamicTyping: true,
        });
    }

    /**
     * @param  {MP4 File} input
     */
    prepVideoFromFile(fileLocation) {
        this.clearCurVideo();
        this.updateVideo('File', {
            fileName: fileLocation
        });
    }

    handleClearButton() {
        this.clearAllData();
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
        const elementList = document.querySelectorAll(".loadData");
        elementList.forEach(element => element.style.display = 'inline');
    }

    hideInputBar() {
        const elementList = document.querySelectorAll(".loadData");
        elementList.forEach(element => element.style.display = 'none');
    }

    loadUserData() {
        this.hideIntroMessage();
        this.clearAllData();
        this.sk.loop(); // rerun P5 draw loop
    }

    /**
     * @param {Array} params
     * [0] String directory/folder
     * [1] String floorPlan image filename
     * [2] String conversation filename
     * [3] Array of String movement filenames
     * [4] String video platform (e.g.File or youTube)
     * [5] Video params(see videoPlayer interface)
     */
    loadExampleData(params) {
        this.hideIntroMessage();
        this.clearAllData();
        this.updateVideo(params[4], params[5]);
        this.sk.inputFloorPlan.update(params[0] + params[1]);
        this.prepExampleCSVFile(params[0], params[2]); // only one conversation file to prep
        for (const fileName of params[3]) this.prepExampleCSVFile(params[0], fileName); // loop through string array to prep each CSV file
    }

    async prepExampleCSVFile(folder, fileName) {
        try {
            const response = await fetch(new Request(folder + fileName));
            const buffer = await response.arrayBuffer();
            const file = new File([buffer], fileName, {
                type: "text/csv",
            });
            this.testFileTypeForProcessing(file);
        } catch (error) {
            alert("Error loading CSV file. Please make sure you have a good internet connection")
            console.log(error);
        }
    }

    /**
     * Replaces existing videoPlayer object with new VideoPlayer object (YouTube or P5FilePlayer)
     * @param  {String} platform
     * @param  {VideoPlayer Specific Params} params
     */
    updateVideo(platform, params) {
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

    clearAllData() {
        this.sk.core.clearAll();
        this.sk.inputFloorPlan.clear();
        this.clearAllCheckboxes();
        this.clearCurVideo();
    }

    clearCurVideo() {
        if (this.sk.dataIsLoaded(this.sk.videoPlayer)) { // if there is a video, destroy it
            this.sk.videoPlayer.destroy();
            this.sk.videoPlayer = null;
            this.sk.sketchController.setIsVideoPlay(false);
            this.sk.sketchController.setIsVideoShow(false);
        }
    }

    /**
     * DOM CHECKBOX UPDATES
     */
    updateMainTab(curItem, mainTabId) {
        let parent = document.getElementById(mainTabId); // Get parent tab to append new div and label to
        let label = document.createElement('label'); //  Make label
        let div = document.createElement('input'); // Make checkbox div
        let span = document.createElement('span'); // Make span to hold new checkbox styles
        let curColor;
        if (this.sk.sketchController.getIsPathColorMode()) curColor = curItem.color.pathMode;
        else curColor = curItem.color.codeMode;
        label.textContent = curItem.name; // set name to text of path
        label.setAttribute('class', 'tab-checkbox');
        div.setAttribute("type", "checkbox");
        span.className = "checkmark";
        span.style.border = "medium solid" + curColor;
        if (curItem.isShowing) {
            span.style.backgroundColor = curColor;
            div.checked = true;
        } else {
            span.style.backgroundColor = "";
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

    clearAllCheckboxes() {
        this.removeAllElements("movementMainTab");
        this.removeAllElements("conversationMainTab");
        this.removeAllElements("codesMainTab");
    }

    removeAllElements(elementId) {
        let element = document.getElementById(elementId);
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    updateWordToSearch() {
        const searchInputDiv = document.getElementById("word-search");
        this.sk.sketchController.setWordToSearch(searchInputDiv.value);
    }
}