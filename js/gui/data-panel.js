class DataPanel {

    constructor(sketch, dataPanelContainer) {
        this.sk = sketch;
        this.xPos = dataPanelContainer.xPos;
        this.spacing = 25;
        this.headers = {
            mode: ["Movement", "Talk", "Select", "Rotate"],
            curMode: 0,
            height: dataPanelContainer.yPos,
        }
        this.data = {
            height: dataPanelContainer.yPos + 50,
            selectMode: ["none", "region", "slice", "moving", "stopped"],
            rotateMode: ["left", "right"]
            // add more modes/tabs here
        }
    }

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
                this.organizeSelectors(mode, curSelectMode);
                break;
            case 3:
                this.organizeRotateKeys(mode);
                break;
        }
    }

    organizeHeaders(mode) {
        let curXPos = this.xPos;
        for (let i = 0; i < this.headers.mode.length; i++) {
            const pixelWidth = this.sk.textWidth(this.headers.mode[i]) + this.spacing;
            if (mode === "draw") this.drawHeaders(curXPos, i);
            else this.handleHeaders(curXPos, pixelWidth, i);
            curXPos += pixelWidth;
        }
    }

    drawHeaders(xPos, header) {
        this.sk.noStroke();
        if (this.headers.curMode === header) this.sk.fill(0);
        else this.sk.fill(150);
        this.sk.text(this.headers.mode[header], xPos, this.headers.height);
    }

    handleHeaders(xPos, pixelWidth, header) {
        if (this.sk.keys.overRect(xPos, this.headers.height, xPos + pixelWidth, this.spacing)) this.headers.curMode = header;
    }

    organizePerson(mode, list) {
        let curXPos = this.xPos;
        for (const person of list) {
            if (mode === "draw") this.drawPerson(person, curXPos);
            else this.overPerson(person, curXPos);;
            curXPos += (2 * this.spacing) + this.sk.textWidth(person.name);
        }
    }

    drawPerson(person, curXPos) {
        this.sk.strokeWeight(5);
        this.sk.stroke(person.color);
        this.sk.noFill();
        this.sk.rect(curXPos, this.data.height, this.spacing, this.spacing);
        if (person.isShowing) {
            this.sk.fill(person.color);
            this.sk.rect(curXPos, this.data.height, this.spacing, this.spacing);
        }
        this.sk.fill(0);
        this.sk.noStroke();
        this.sk.text(person.name, curXPos + 1.3 * this.spacing, this.data.height);
    }

    overPerson(person, curXPos) {
        const nameWidth = this.sk.textWidth(person.name); // set nameWidth to pixel width of path name
        if (this.sk.keys.overRect(curXPos, this.data.height, this.spacing + nameWidth, this.spacing)) this.sk.keys.setCoreData(person);
    }

    organizeSelectors(mode, curSelectMode) {
        let curXPos = this.xPos;
        for (let i = 0; i < this.data.selectMode.length; i++) {
            const pixelWidth = this.sk.textWidth(this.data.selectMode[i]) + this.spacing;
            if (mode === "draw") this.drawSelector(curXPos, curSelectMode, i);
            else this.overSelector(curXPos, pixelWidth, i);
            curXPos += pixelWidth;
        }
    }

    drawSelector(curXPos, curSelectMode, i) {
        if (curSelectMode === i) this.sk.fill(0);
        else this.sk.fill(150);
        this.sk.text(this.data.selectMode[i], curXPos, this.data.height);
    }

    overSelector(curXPos, pixelWidth, i) {
        if (this.sk.keys.overRect(curXPos, this.data.height, curXPos + pixelWidth, this.spacing)) this.sk.keys.setSelectMode(i);
    }


    organizeRotateKeys(mode) {
        let curXPos = this.xPos;
        for (const angle of this.data.rotateMode) {
            const pixelWidth = this.sk.textWidth(angle) + this.spacing;
            if (mode === "draw") this.drawRotateKey(angle, curXPos);
            else this.overRotateKey(angle, curXPos, pixelWidth);
            curXPos += pixelWidth;
        }
    }

    drawRotateKey(angle, curXPos) {
        this.sk.noStroke();
        this.sk.fill(0);
        this.sk.text(angle, curXPos, this.data.height);
    }

    overRotateKey(angle, curXPos, pixelWidth) {
        if (this.sk.keys.overRect(curXPos, this.data.height, curXPos + pixelWidth, this.spacing)) {
            if (angle === this.data.rotateMode[0]) this.sk.keys.setRotateLeft();
            else this.sk.keys.setRotateRight();
        }
    }
}