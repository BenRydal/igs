class DataPanel {
    /**
     * Data panel consists of a header object and associated tabs object that holds all data/labels for each header
     * Each header/tab has an organize method that handles drawing and mouse handlers/over methods
     * To add another header/tab, update string lists and add organize/draw/over methods
     */
    constructor(sketch, dataPanelContainer) {
        this.sk = sketch;
        this.xPos = dataPanelContainer.xPos;
        this.spacing = 25;
        this.headers = {
            mode: ["Movement", "Talk", "Floor Plan", "Select"],
            curMode: 0,
            height: dataPanelContainer.headerYPos,
        }
        this.tabs = {
            height: dataPanelContainer.tabsYPos,
            selectMode: ["none", "region", "slice", "moving", "stopped"],
            rotateMode: ["rotate left", "rotate right"]
        }
    }
    /**
     * Passed values allow for dynamic display/updating
     */
    organize(mode, pathList, speakerList, curSelectMode) {
        this.organizeHeaders(mode);
        switch (this.headers.curMode) {
            case 0:
                this.organizePerson(mode, pathList);
                break;
            case 1:
                this.organizePerson(mode, speakerList);
                break;
            case 2:
                this.organizeRotateKeys(mode);
                break;
            case 3:
                this.organizeSelectors(mode, curSelectMode);
                break;
        }
    }

    organizeHeaders(mode) {
        let curXPos = this.xPos;
        for (let i = 0; i < this.headers.mode.length; i++) {
            const pixelWidth = this.sk.textWidth(this.headers.mode[i]) + this.spacing;
            if (mode === this.sk.DRAWGUI) this.drawHeader(curXPos, i);
            else this.overHeader(curXPos, pixelWidth, i);
            curXPos += pixelWidth;
        }
    }

    organizePerson(mode, list) {
        let curXPos = this.xPos;
        for (const person of list) {
            if (mode === this.sk.DRAWGUI) this.drawPerson(person, curXPos);
            else this.overPerson(person, curXPos);
            curXPos += (2 * this.spacing) + this.sk.textWidth(person.name);
        }
    }

    organizeSelectors(mode, curSelectMode) {
        let curXPos = this.xPos;
        for (let i = 0; i < this.tabs.selectMode.length; i++) {
            const pixelWidth = this.sk.textWidth(this.tabs.selectMode[i]) + this.spacing;
            if (mode === this.sk.DRAWGUI) this.drawSelector(curXPos, curSelectMode, i);
            else this.overSelector(curXPos, pixelWidth, i);
            curXPos += pixelWidth;
        }
    }

    organizeRotateKeys(mode) {
        let curXPos = this.xPos;
        for (const direction of this.tabs.rotateMode) {
            const pixelWidth = this.sk.textWidth(direction) + this.spacing;
            if (mode === this.sk.DRAWGUI) this.drawRotateKey(direction, curXPos);
            else this.overRotateKey(direction, curXPos, pixelWidth);
            curXPos += pixelWidth;
        }
    }

    drawHeader(xPos, header) {
        this.sk.noStroke();
        if (this.headers.curMode === header) this.sk.fill(0);
        else this.sk.fill(150);
        this.sk.text(this.headers.mode[header], xPos, this.headers.height);
    }

    drawPerson(person, curXPos) {
        this.sk.strokeWeight(5);
        this.sk.stroke(person.color);
        this.sk.noFill();
        this.sk.rect(curXPos, this.tabs.height, this.spacing, this.spacing);
        if (person.isShowing) {
            this.sk.fill(person.color);
            this.sk.rect(curXPos, this.tabs.height, this.spacing, this.spacing);
        }
        this.sk.fill(0);
        this.sk.noStroke();
        this.sk.text(person.name, curXPos + 1.3 * this.spacing, this.tabs.height - 5);
    }

    drawSelector(curXPos, curSelectMode, tab) {
        if (curSelectMode === tab) this.sk.fill(0);
        else this.sk.fill(150);
        this.sk.text(this.tabs.selectMode[tab], curXPos, this.tabs.height);
    }

    drawRotateKey(direction, curXPos) {
        this.sk.noStroke();
        this.sk.fill(0);
        this.sk.text(direction, curXPos, this.tabs.height);
    }

    overHeader(xPos, pixelWidth, header) {
        if (this.sk.overRect(xPos, this.headers.height, xPos + pixelWidth, this.spacing)) this.headers.curMode = header;
    }

    overPerson(person, curXPos) {
        if (this.sk.overRect(curXPos, this.tabs.height, this.spacing, this.spacing)) this.sk.keys.setCoreData(person);
    }

    overSelector(curXPos, pixelWidth, tab) {
        if (this.sk.overRect(curXPos, this.tabs.height, curXPos + pixelWidth, this.spacing)) this.sk.keys.setSelectMode(tab);
    }

    overRotateKey(direction, curXPos, pixelWidth) {
        if (this.sk.overRect(curXPos, this.tabs.height, curXPos + pixelWidth, this.spacing)) {
            if (direction === this.tabs.rotateMode[0]) this.sk.keys.setRotateLeft();
            else this.sk.keys.setRotateRight();
        }
    }
}