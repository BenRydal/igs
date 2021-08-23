class DataPanel {

    constructor(keys, xPos, yPos) {
        this.keys = keys; // keys contains reference to the sketch as keys.sk
        this.xPos = xPos;
        this.spacing = 25;
        this.headers = {
            mode: ["Movement", "Conversation", "Select", "Rotate"],
            curMode: 0,
            height: yPos,
        }
        this.data = {
            height: yPos + 50,
            selectMode: ["none", "region", "slice", "moving", "stopped"],
            rotateMode: ["left", "right"]
            // add more modes/tabs here
        }
    }

    // DRAW METHODS
    draw(pathList, speakerList, selectMode) {
        this.drawHeaders();
        switch (this.headers.curMode) {
            case 0:
                this.drawDataKeys(pathList);
                break;
            case 1:
                this.drawDataKeys(speakerList);
                break;
            case 2:
                this.drawSelectKeys(selectMode);
                break;
            case 3:
                this.drawRotateKeys();
                break;
        }
    }

    // draw current mode in black, all others in grey
    drawHeaders() {
        this.keys.sk.noStroke();
        let curXPos = this.xPos;
        for (let i = 0; i < this.headers.mode.length; i++) {
            if (this.headers.curMode === i) this.keys.sk.fill(0);
            else this.keys.sk.fill(150);
            this.keys.sk.text(this.headers.mode[i], curXPos, this.headers.height);
            curXPos += this.keys.sk.textWidth(this.headers.mode[i]) + this.spacing;
        }
    }

    // Loop through speakers and set fill/stroke in this for all if showing/not showing
    drawDataKeys(list) {
        let currXPos = this.xPos;
        this.keys.sk.strokeWeight(5);
        for (const person of list) {
            this.keys.sk.stroke(person.color);
            this.keys.sk.noFill();
            this.keys.sk.rect(currXPos, this.data.height, this.spacing, this.spacing);
            if (person.isShowing) {
                this.keys.sk.fill(person.color);
                this.keys.sk.rect(currXPos, this.data.height, this.spacing, this.spacing);
            }
            this.keys.sk.fill(0);
            this.keys.sk.noStroke();
            this.keys.sk.text(person.name, currXPos + 1.3 * this.spacing, this.data.height);
            currXPos += (2 * this.spacing) + this.keys.sk.textWidth(person.name);
        }
    }

    drawSelectKeys(selectMode) {
        this.keys.sk.noStroke();
        let curXPos = this.xPos;
        for (let i = 0; i < this.data.selectMode.length; i++) {
            if (selectMode === i) this.keys.sk.fill(0);
            else this.keys.sk.fill(150);
            this.keys.sk.text(this.data.selectMode[i], curXPos, this.data.height);
            curXPos += this.keys.sk.textWidth(this.data.selectMode[i]) + this.spacing;
        }
    }

    drawRotateKeys() {
        this.keys.sk.noStroke();
        this.keys.sk.fill(0);
        let curXPos = this.xPos;
        for (const s of this.data.rotateMode) {
            this.keys.sk.text(s, curXPos, this.data.height);
            curXPos += this.keys.sk.textWidth(s) + this.spacing;
        }
    }

    handleHeaders() {
        let curXPos = this.xPos;
        for (let i = 0; i < this.headers.mode.length; i++) {
            const pixelWidth = this.keys.sk.textWidth(this.headers.mode[i]) + this.spacing;
            if (this.keys.overRect(curXPos, this.headers.height, curXPos + pixelWidth, this.spacing)) this.headers.curMode = i;
            curXPos += pixelWidth;
        }
    }

    handleData(pathList, speakerList) {
        switch (this.headers.curMode) {
            case 0:
                this.overDataKeys(pathList);
                break;
            case 1:
                this.overDataKeys(speakerList);
                break;
            case 2:
                this.overSelectKeys();
                break;
            case 3:
                this.overRotateKeys();
                break;
        }
    }

    overDataKeys(list) {
        let currXPos = this.xPos;
        for (const person of list) {
            const nameWidth = this.keys.sk.textWidth(person.name); // set nameWidth to pixel width of path name
            if (this.keys.overRect(currXPos, this.data.height, this.spacing + nameWidth, this.spacing)) this.keys.setCoreData(person);
            currXPos += (2 * this.spacing) + nameWidth;
        }
    }

    overSelectKeys() {
        let curXPos = this.xPos;
        for (let i = 0; i < this.data.selectMode.length; i++) {
            const pixelWidth = this.keys.sk.textWidth(this.data.selectMode[i]) + this.spacing;
            if (this.keys.overRect(curXPos, this.data.height, curXPos + pixelWidth, this.spacing)) this.keys.setSelectMode(i);
            curXPos += pixelWidth;
        }
    }

    overRotateKeys() {
        let curXPos = this.xPos;
        for (let i = 0; i < this.data.rotateMode.length; i++) {
            const pixelWidth = this.keys.sk.textWidth(this.data.rotateMode[i]) + this.spacing;
            if (this.keys.overRect(curXPos, this.data.height, curXPos + pixelWidth, this.spacing)) this.keys.updateRotateMode(i);
            curXPos += pixelWidth;
        }
    }
}