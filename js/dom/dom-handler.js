class DomHandler {

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

    handleClearButton() {
        this.clearAllData();
        this.sk.sketchController.setIsPathColorMode(true); // set to true in case user has changed color based on loaded code files
        this.sk.loop(); // rerun P5 draw loop
    }

    handleToggle3DButton() {
        this.sk.handle3D.update();
    }

    handleHowToButton() {
        let element = document.querySelector('.introContainer');
        if (element.style.display === 'none') element.style.display = 'block';
        else element.style.display = 'none';
    }

    handleWordSearchInput() {
        const searchInputDiv = document.getElementById("word-search");
        this.sk.sketchController.setWordToSearch(searchInputDiv.value);
    }

    handleExampleDropDown() {
        const option = document.getElementById("examples").value;
        if (option === "Load Data") this.showLoadDataButtons();
        else this.hideLoadDataButtons();
        this.resetOnDropDownSelection();
        switch (option) {
            case "Example 1":
                this.loadExampleData(['data/example-1/', 'floorplan.png', 'conversation.csv', ['Jordan.csv', 'Possession.csv'], 'Youtube', {
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
                this.loadExampleData(['data/example-3/', 'floorplan.png', 'conversation.csv', ['Teacher.csv', 'lesson-graph.csv'], 'Youtube', {
                    videoId: 'Iu0rxb-xkMk'
                }]);
                this.sk.sketchController.setIsAllTalk(true);
                break;
            case "Example 4":
                this.loadExampleData(['data/example-4/', 'floorplan.png', 'conversation.csv', ['Teacher.csv', 'Sean.csv', 'Mei.csv', 'Cassandra.csv', 'Nathan.csv'], 'Youtube', {
                    videoId: 'OJSZCK4GPQY'
                }]);
                this.sk.sketchController.setIsAllTalk(false);
                break;
        }
    }

    resetOnDropDownSelection() {
        this.hideIntroMessage();
        this.clearAllData();
        if (!this.sk.sketchController.getIsPathColorMode()) {
            this.sk.sketchController.setIsPathColorMode(true); // set to true in case user has changed color based on loaded code files
            this.sk.domController.resetColorMode();
            this.sk.domController.toggleColorChangeButtons();
        }
        if (this.sk.sketchController.getIsAnimate()) this.sk.sketchController.startEndAnimation(); // reset animation if running
    }

    /**
     * Extension and MIME type test are used to provide most inclusive testing of file format
     * @param  {File} file
     */
    testFileTypeForProcessing(file) {
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith(".csv") || file.type === "text/csv") this.parseCSVFile(file);
        else if (fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || file.type === "image/png" || file.type === "image/jpg" || file.type === "image/jpeg") this.sk.floorPlan.update(URL.createObjectURL(file));
        else if (fileName.endsWith(".mp4") || file.type === "video/mp4") this.prepVideoFromFile(URL.createObjectURL(file));
        else alert("Error loading file. Please make sure your file is an accepted format"); // this should not be possible due to HTML5 accept for file inputs, but in case
    }

    parseCSVFile(fileToParse) {
        Papa.parse(fileToParse, {
            dynamicTyping: true, // If true, numeric and boolean data will be converted to their type instead of remaining strings
            skipEmptyLines: 'greedy', // If set to 'greedy', lines that don't have any content (those which have only whitespace after parsing) will also be skipped
            header: 'true',
            transformHeader: (h) => {
                return h.trim().toLowerCase();
            },
            complete: (results, file) => {
                console.log("Parsing complete:", results, file);
                this.sk.core.testParsedResultsForProcessing(results, file);
            },
            error: (error, file) => {
                alert("Parsing error with one of your CSV file. Please make sure your file is formatted correctly as a .CSV");
                console.log(error, file);
            }
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


    hideIntroMessage() {
        let element = document.querySelector('.introContainer');
        element.style.display = 'none';
    }


    showLoadDataButtons() {
        const elementList = document.querySelectorAll(".loadData");
        elementList.forEach(element => element.style.display = 'inline');
    }

    hideLoadDataButtons() {
        const elementList = document.querySelectorAll(".loadData");
        elementList.forEach(element => element.style.display = 'none');
    }

    /**
     * @param {Array} params
     * [0] String directory/folder
     * [1] String floorPlan image filename
     * [2] String conversation filename
     * [3] Array of String filenames
     * [4] String video platform (e.g.File or youTube)
     * [5] Video params(see videoPlayer interface)
     */
    loadExampleData(params) {
        this.sk.floorPlan.update(params[0] + params[1]);
        this.prepExampleCSVFile(params[0], params[2]); // only one conversation file to prep
        for (const fileName of params[3]) this.prepExampleCSVFile(params[0], fileName); // loop through string array to prep each CSV file
        this.updateVideo(params[4], params[5]);
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
            alert("Error loading CSV file. Please make sure you have a good internet connection");
            console.log(error);
        }
    }

    /**
     * Replaces existing videoPlayer object with new VideoPlayer object (YouTube or P5FilePlayer)
     * @param  {String} platform
     * @param  {VideoPlayer Specific Params} params
     */
    updateVideo(platform, params) {
        try {
            switch (platform) {
                case "Youtube":
                    this.sk.videoPlayer = new YoutubePlayer(this.sk, params);
                    break;
                case "File":
                    this.sk.videoPlayer = new P5FilePlayer(this.sk, params);
                    break;
            }
        } catch (error) {
            alert("Error loading video file. Please make sure your video is formatted correctly as a .MP4 file or if loading an example dataset that you have access to YouTube");
            console.log(error);
        }
    }

    clearAllData() {
        this.sk.core.clearAll();
        this.sk.floorPlan.clear();
        this.sk.domController.clearAllCheckboxes();
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
}