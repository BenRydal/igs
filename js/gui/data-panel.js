/**
 * Data panel consists of a header object and associated tabs object that holds all data/labels for each header
 * Each header/tab has an organize method that handles drawing and mouse handlers/over methods
 * To add another header/tab, update string lists in constructor and add organize/draw/over methods
 */
class DataPanel {

    constructor(sketch, timelineBottom) {
        this.sk = sketch;
        this.xPos = 10; // starting x position of data panel
        this.spacing = this.sk.height / 45; // single variable controls spacing of elements in data panel
        this.headers = {
            height: timelineBottom,
            tabs: this.createMultiTab(["MOVEMENT", "SPEAKERS", "TALK", "ANIMATE", "SELECT", "FLOOR PLAN", "CODES", "COLOR"])
        }
        this.tabs = {
            height: timelineBottom + this.spacing * 2,
            select: this.createMultiTab(["none", "region", "slice", "moving", "stopped"]),
            color: this.createMultiTab(["people", "codes"]),
            rotate: this.createSingleTab(["rotate left", "rotate right"]),
            talk: this.createSingleTab(["align", "all speakers on path"]),
            animate: this.createSingleTab(["start/end", "pause/play"])
        }
    }
    /**
     * A MultiTab has list of names and an integer curTab to allow for different selection possibilities of sub-tabs
     */
    createMultiTab(nameArray) {
        return {
            names: nameArray,
            curTab: 0
        }
    }
    /**
     * A single tab is a tab with only a list of names
     */
    createSingleTab(nameArray) {
        return {
            names: nameArray
        }
    }

    /**
     * Organizes whether and which tabs to draw or handle mouse events in data panel
     * NOTE: the integers passed to organizeSingle/MultiTab methods determine method calls later in setMulti/SingleTab methods
     * @param  {Integer} mode // program constant for determining gui drawing or handling
     * @param  {Array} pathList // program data that allows for dynamic GUI display and updating
     * @param  {Array} speakerList
     * @param  {Array} codeList
     */
    organize(mode, pathList, speakerList, codeList) {
        this.organizeHeaders(mode); // Draws or tests if over headers
        switch (this.headers.tabs.curTab) {
            case 0:
                this.organizeList(mode, pathList);
                break;
            case 1:
                this.organizeList(mode, speakerList);
                break;
            case 2:
                this.organizeSingleTab(mode, this.tabs.talk.names, 0);
                break;
            case 3:
                this.organizeSingleTab(mode, this.tabs.animate.names, 1);
                break;
            case 4:
                this.organizeMultiTab(mode, this.tabs.select, 0);
                break;
            case 5:
                this.organizeSingleTab(mode, this.tabs.rotate.names, 2);
                break;
            case 6:
                this.organizeList(mode, codeList);
                break;
            case 7:
                this.organizeMultiTab(mode, this.tabs.color, 1);
                break;
        }
    }

    /**
     * Four different organize methods organize four respective drawing or mouse over method calls
     */
    organizeHeaders(mode) {
        let curXPos = this.xPos;
        for (let i = 0; i < this.headers.tabs.names.length; i++) {
            const pixelWidth = this.sk.textWidth(this.headers.tabs.names[i]) + this.spacing;
            if (mode === this.sk.DRAWGUI) this.drawHeader(curXPos, i);
            else this.overHeader(curXPos, pixelWidth, i);
            curXPos += pixelWidth;
        }
    }

    organizeSingleTab(mode, tabList, setMethod) {
        let curXPos = this.xPos;
        for (let i = 0; i < tabList.length; i++) {
            const pixelWidth = this.sk.textWidth(tabList[i]) + this.spacing;
            if (mode === this.sk.DRAWGUI) this.drawSingleTab(tabList[i], curXPos);
            else this.overSingleTab(curXPos, pixelWidth, i, setMethod);
            curXPos += pixelWidth;
        }
    }

    organizeMultiTab(mode, tabs, setMethod) {
        let curXPos = this.xPos;
        for (let i = 0; i < tabs.names.length; i++) {
            const pixelWidth = this.sk.textWidth(tabs.names[i]) + this.spacing;
            if (mode === this.sk.DRAWGUI) this.drawMultiTab(curXPos, tabs, i);
            else this.overMultiTab(curXPos, pixelWidth, i, setMethod);
            curXPos += pixelWidth;
        }
    }

    organizeList(mode, list) {
        let curXPos = this.xPos;
        for (const person of list) {
            if (mode === this.sk.DRAWGUI) this.drawList(person, curXPos);
            else this.overList(person, curXPos);
            curXPos += (2 * this.spacing) + this.sk.textWidth(person.name);
        }
    }

    drawHeader(xPos, header) {
        this.sk.noStroke();
        if (this.headers.tabs.curTab === header) this.sk.fill(0);
        else this.sk.fill(this.sk.COLORGRAY);
        this.sk.text(this.headers.tabs.names[header], xPos, this.headers.height);
    }

    drawSingleTab(tabName, curXPos) {
        this.sk.noStroke();
        this.sk.fill(0);
        this.sk.text(tabName, curXPos, this.tabs.height);
    }

    drawMultiTab(curXPos, tabs, selectedTab) {
        if (tabs.curTab === selectedTab) this.sk.fill(0);
        else this.sk.fill(this.sk.COLORGRAY);
        this.sk.text(tabs.names[selectedTab], curXPos, this.tabs.height);
    }

    // drawList(person, curXPos) {
    //     let curColor;
    //     if (this.isColorTabPathMode()) curColor = person.color.pathMode;
    //     else curColor = person.color.codeMode;
    //     if (person.isShowing) { // draw checkbox with color fill
    //         this.sk.fill(curColor);
    //         this.sk.rect(curXPos, this.tabs.height, this.spacing, this.spacing);
    //     } else { // only draw checkbox outline with color
    //         this.sk.strokeWeight(3);
    //         this.sk.stroke(curColor);
    //         this.sk.noFill();
    //         this.sk.rect(curXPos, this.tabs.height, this.spacing, this.spacing);
    //     }
    //     this.sk.fill(0);
    //     this.sk.noStroke();
    //     this.sk.text(person.name, curXPos + 1.3 * this.spacing, this.tabs.height - 5);
    // }

    overHeader(xPos, pixelWidth, header) {
        if (this.sk.overRect(xPos, this.headers.height, xPos + pixelWidth, this.spacing)) this.headers.tabs.curTab = header;
    }

    overSingleTab(curXPos, pixelWidth, selectedTab, setMethod) {
        if (this.sk.overRect(curXPos, this.tabs.height, curXPos + pixelWidth, this.spacing)) this.setSingleTab(setMethod, selectedTab);
    }

    overMultiTab(curXPos, pixelWidth, selectedTab, setMethod) {
        if (this.sk.overRect(curXPos, this.tabs.height, curXPos + pixelWidth, this.spacing)) this.setMultiTab(setMethod, selectedTab);
    }

    overList(person, curXPos) {
        if (this.sk.overRect(curXPos, this.tabs.height, this.spacing, this.spacing)) this.sk.sketchController.setCoreData(person);
    }

    getCurSelectTab() {
        return this.tabs.select.curTab;
    }


    setMultiTab(setMethod, newTab) {
        switch (setMethod) {
            case 0:
                this.tabs.select.curTab = newTab;
                break;
            case 1:
                this.tabs.color.curTab = newTab;
                break;
        }
    }

    setSingleTab(setMethod, selectedTab) {
        switch (setMethod) {
            case 0:
                if (selectedTab === 0) this.sk.sketchController.toggleIsAlignTalk();
                else this.sk.sketchController.toggleIsAllTalk();
                break;
            case 1:
                if (selectedTab === 0) this.sk.sketchController.startEndAnimation();
                else this.sk.sketchController.toggleIsAnimatePause();
                break;
            case 2:
                if (selectedTab === 0) this.sk.sketchController.setRotateLeft();
                else this.sk.sketchController.setRotateRight();
                break;
        }
    }
}