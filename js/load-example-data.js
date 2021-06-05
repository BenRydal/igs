  class ExampleData {

    /**
     * Selects load data or example data option
     * Example data format: [String directory, String floorPlan image file, String conversation File, String movement File[], String video platform, video params(see Video Player Interface)]
     * NOTE: called from user selection in drop down menu
     * NOTE: Calls input bar and clears all data for load data 
     */
    selectExampleData() {
      if (core.isModeVideoShowing) handlers.overVideoButton(); // Turn off video that if showing
      core.isModeIntro = false; // Hide intro msg if showing
      let option = document.getElementById("examples").value;
      switch (option) {
        case "Load Data":
          core.clearAllData();
          this.showInputBar();
          loop(); // rerun P5 draw loop
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
    /**
     * Handles asynchronous loading of example data from a selected example array of data
     * @param  {[String directory, String floorPlan image file, String conversation File, String movement File[], String video platform, video params (see Video Player Interface)]} params
     */
    async loadExample(params) {
      this.hideInputBar();
      processData.processVideo(params[4], params[5]);
      processData.processFloorPlan(params[0] + params[1]);
      // Process conversation then movement files
      await this.getExampleConversationFile(params[0], params[2]).then(parseData.parseConversationFile);
      this.getExampleMovementFiles(params[0], params[3]).then(parseData.parseMovementFiles);
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