export function addListeners(sk) {
    // Main Menu Bar
    document.getElementById("data-drop-down-menu").addEventListener("change", sk.domHandler.handleExampleDropDown.bind(sk.domHandler));
    document.getElementById("input-load-files").addEventListener("change", sk.domHandler.handleLoadFileButton.bind(sk.domHandler));
    document.getElementById("clear-button").addEventListener("click", sk.domHandler.handleClearButton.bind(sk.domHandler));
    document.getElementById("3D-button").addEventListener("click", sk.domHandler.handleToggle3DButton.bind(sk.domHandler));
    document.getElementById("how-to-button").addEventListener("click", sk.domHandler.handleHowToButton.bind(sk.domHandler));
    // Tab 1 Movement
    document.getElementById("sub-tab1-1").addEventListener("change", function() {
        sk.domController.updateSubTab(this.checked, "movement");
    });
    // Tab 2 Talk
    document.getElementById("sub-tab3-1").addEventListener("change", sk.domHandler.handleWordSearchInput.bind(sk.domHandler));
    document.getElementById("sub-tab3-2").addEventListener("click", sk.sketchController.toggleIsAlignTalk.bind(sk.sketchController));
    document.getElementById("sub-tab3-3").addEventListener("click", sk.sketchController.toggleIsAllTalk.bind(sk.sketchController));
    document.getElementById("sub-tab3-4").addEventListener("change", function() {
        sk.domController.updateSubTab(this.checked, "talk");
    });
    // Tab 3 Video
    document.getElementById("sub-tab4-1").addEventListener("click", sk.videoController.toggleShowVideo.bind(sk.videoController));
    document.getElementById("sub-tab4-2").addEventListener("click", sk.videoController.buttonPlayPause.bind(sk.videoController));
    document.getElementById("sub-tab4-3").addEventListener("click", sk.videoController.increasePlayerSize.bind(sk.videoController));
    document.getElementById("sub-tab4-4").addEventListener("click", sk.videoController.decreasePlayerSize.bind(sk.videoController));
    // Tab 4 Animate 
    document.getElementById("sub-tab5-1").addEventListener("click", sk.sketchController.startEndAnimation.bind(sk.sketchController));
    document.getElementById("sub-tab5-2").addEventListener("click", sk.sketchController.toggleIsAnimatePause.bind(sk.sketchController));
    // Tab 5 Select
    document.getElementById("sub-tab6-1").addEventListener("click", function() {
        sk.sketchController.setCurSelectTab(0);
        sk.gui.highlight.resetHighlightArray();
    });
    document.getElementById("sub-tab6-2").addEventListener("click", function() {
        sk.sketchController.setCurSelectTab(1);
    });
    document.getElementById("sub-tab6-3").addEventListener("click", function() {
        sk.sketchController.setCurSelectTab(2);
    });
    document.getElementById("sub-tab6-4").addEventListener("click", function() {
        sk.sketchController.setCurSelectTab(3);
    });
    document.getElementById("sub-tab6-5").addEventListener("click", function() {
        sk.sketchController.setCurSelectTab(4);
    });
    document.getElementById("sub-tab6-6").addEventListener("click", function() {
        sk.sketchController.setCurSelectTab(5);
    });
    // Tab 6 Floor Plan
    document.getElementById("sub-tab7-1").addEventListener("click", sk.floorPlan.setRotateLeft.bind(sk.floorPlan));
    document.getElementById("sub-tab7-2").addEventListener("click", sk.floorPlan.setRotateRight.bind(sk.floorPlan));
    // Tab 7 Codes
    document.getElementById("sub-tab8-1").addEventListener("click", sk.domHandler.handleColorModeButton.bind(sk.domHandler));
    document.getElementById("sub-tab8-2").addEventListener("change", function() {
        sk.domController.updateSubTab(this.checked, "codes");
    });
    // Tab 8 Export
    document.getElementById("sub-tab9-1").addEventListener("click", sk.saveCodeFile.bind(sk));

    // Update sketch loop for specific tabs/elements
    document.querySelectorAll('.loop-sketch').forEach(element => {
        element.addEventListener('click', function() {
            sk.loop();
        });
    });
}