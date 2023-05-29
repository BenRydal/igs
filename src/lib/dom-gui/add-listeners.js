/**
 * @param {{ domHandler: { handleExampleDropDown: { bind: (arg0: any) => (this: HTMLElement, ev: Event) => any; }; handleLoadFileButton: { bind: (arg0: any) => (this: HTMLElement, ev: Event) => any; }; handleClearButton: { bind: (arg0: any) => (this: HTMLElement, ev: MouseEvent) => any; }; handleToggle3DButton: { bind: (arg0: any) => (this: HTMLElement, ev: MouseEvent) => any; }; handleHowToButton: { bind: (arg0: any) => (this: HTMLElement, ev: MouseEvent) => any; }; handleWordSearchInput: { bind: (arg0: any) => (this: HTMLElement, ev: Event) => any; }; handleColorModeButton: { bind: (arg0: any) => (this: HTMLElement, ev: MouseEvent) => any; }; }; domController: { updateSubTab: (arg0: any, arg1: string) => void; }; sketchController: { toggleIsAlignTalk: { bind: (arg0: any) => (this: HTMLElement, ev: MouseEvent) => any; }; toggleIsAllTalk: { bind: (arg0: any) => (this: HTMLElement, ev: MouseEvent) => any; }; startEndAnimation: { bind: (arg0: any) => (this: HTMLElement, ev: MouseEvent) => any; }; toggleIsAnimatePause: { bind: (arg0: any) => (this: HTMLElement, ev: MouseEvent) => any; }; setCurSelectTab: (arg0: number) => void; }; videoController: { toggleShowVideo: { bind: (arg0: any) => (this: HTMLElement, ev: MouseEvent) => any; }; buttonPlayPause: { bind: (arg0: any) => (this: HTMLElement, ev: MouseEvent) => any; }; increasePlayerSize: { bind: (arg0: any) => (this: HTMLElement, ev: MouseEvent) => any; }; decreasePlayerSize: { bind: (arg0: any) => (this: HTMLElement, ev: MouseEvent) => any; }; }; gui: { highlight: { resetHighlightArray: () => void; }; }; floorPlan: { setRotateLeft: { bind: (arg0: any) => (this: HTMLElement, ev: MouseEvent) => any; }; setRotateRight: { bind: (arg0: any) => (this: HTMLElement, ev: MouseEvent) => any; }; }; saveCodeFile: { bind: (arg0: any) => (this: HTMLElement, ev: MouseEvent) => any; }; loop: () => void; }} p5
 */
export function AddListeners(p5) {
    // Main Menu Bar
    document.getElementById("select-data-dropdown")?.addEventListener("change", p5.domHandler.handleExampleDropDown.bind(p5.domHandler));
    document.getElementById("btn-load-files")?.addEventListener("change", p5.domHandler.handleLoadFileButton.bind(p5.domHandler));
    // document.getElementById("clear-button")?.addEventListener("click", p5.domHandler.handleClearButton.bind(p5.domHandler));
    document.getElementById("btn-toggle-3d")?.addEventListener("click", p5.domHandler.handleToggle3DButton.bind(p5.domHandler));
    document.getElementById("btn-help")?.addEventListener("click", p5.domHandler.handleHowToButton.bind(p5.domHandler));
    // Tab 1 Movement
    document.getElementById("sub-tab1-1")?.addEventListener("change", function() {
        p5.domController.updateSubTab(this.checked, "movement");
    });
    // Tab 2 Talk
    document.getElementById("sub-tab3-1")?.addEventListener("change", p5.domHandler.handleWordSearchInput.bind(p5.domHandler));
    document.getElementById("sub-tab3-2")?.addEventListener("click", p5.sketchController.toggleIsAlignTalk.bind(p5.sketchController));
    document.getElementById("sub-tab3-3")?.addEventListener("click", p5.sketchController.toggleIsAllTalk.bind(p5.sketchController));
    document.getElementById("sub-tab3-4")?.addEventListener("change", function() {
        p5.domController.updateSubTab(this.checked, "talk");
    });
    // Tab 3 Video
    document.getElementById("sub-tab4-1")?.addEventListener("click", p5.videoController.toggleShowVideo.bind(p5.videoController));
    document.getElementById("sub-tab4-2")?.addEventListener("click", p5.videoController.buttonPlayPause.bind(p5.videoController));
    document.getElementById("sub-tab4-3")?.addEventListener("click", p5.videoController.increasePlayerSize.bind(p5.videoController));
    document.getElementById("sub-tab4-4")?.addEventListener("click", p5.videoController.decreasePlayerSize.bind(p5.videoController));
    // Tab 4 Animate
    document.getElementById("sub-tab5-1")?.addEventListener("click", p5.sketchController.startEndAnimation.bind(p5.sketchController));
    document.getElementById("sub-tab5-2")?.addEventListener("click", p5.sketchController.toggleIsAnimatePause.bind(p5.sketchController));
    // Tab 5 Select
    document.getElementById("sub-tab6-1")?.addEventListener("click", function() {
        p5.sketchController.setCurSelectTab(0);
        p5.gui.highlight.resetHighlightArray();
    });
    document.getElementById("sub-tab6-2")?.addEventListener("click", function() {
        p5.sketchController.setCurSelectTab(1);
    });
    document.getElementById("sub-tab6-3")?.addEventListener("click", function() {
        p5.sketchController.setCurSelectTab(2);
    });
    document.getElementById("sub-tab6-4")?.addEventListener("click", function() {
        p5.sketchController.setCurSelectTab(3);
    });
    document.getElementById("sub-tab6-5")?.addEventListener("click", function() {
        p5.sketchController.setCurSelectTab(4);
    });
    document.getElementById("sub-tab6-6")?.addEventListener("click", function() {
        p5.sketchController.setCurSelectTab(5);
    });
    // Tab 6 Floor Plan
    document.getElementById("sub-tab7-1")?.addEventListener("click", p5.floorPlan.setRotateLeft.bind(p5.floorPlan));
    document.getElementById("sub-tab7-2")?.addEventListener("click", p5.floorPlan.setRotateRight.bind(p5.floorPlan));
    // Tab 7 Codes
    document.getElementById("sub-tab8-1")?.addEventListener("click", p5.domHandler.handleColorModeButton.bind(p5.domHandler));
    document.getElementById("sub-tab8-2")?.addEventListener("change", function() {
        p5.domController.updateSubTab(this.checked, "codes");
    });
    // Tab 8 Export
    document.getElementById("sub-tab9-1")?.addEventListener("click", p5.saveCodeFile.bind(sk));

    // Update sketch loop for specific tabs/elements
    document.querySelectorAll('.loop-sketch')?.forEach(element => {
        element.addEventListener('click', function() {
            p5.loop();
        });
    });
}