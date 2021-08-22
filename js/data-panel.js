class DataPanel {

    constructor(keys, xPos, yPos) {
        this.keys = keys; // keys contains reference to the sketch as keys.sk
        this.xPos = xPos;
        this.spacing = 25;
        this.headers = {
            mode: ["Movement", "Conversation", "Select"],
            curMode: 0,
            height: yPos,
        }
        this.data = {
            height: yPos + 50,
            selectMode: ["off", "region", "slice", "movement", "stops"],
            curSelectMode: 0,
        }
    }

    // DRAW METHODS
    draw(pathList, speakerList) {
        this.drawHeaders();
        switch (this.headers.curMode) {
            case 0:
                this.drawDataKeys(pathList);
                break;
            case 1:
                this.drawDataKeys(speakerList);
                break;
            case 2:
                this.drawSelectKeys();
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

    drawSelectKeys() {
        this.keys.sk.noStroke();
        let curXPos = this.xPos;
        for (let i = 0; i < this.data.selectMode.length; i++) {
            if (this.data.curSelectMode === i) this.keys.sk.fill(0);
            else this.keys.sk.fill(150);
            this.keys.sk.text(this.data.selectMode[i], curXPos, this.data.height);
            curXPos += this.keys.sk.textWidth(this.data.selectMode[i]) + this.spacing;
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
                this.overSelectKeys(); // give it "left and right"
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

    overSelectKeys() {}

}

// drawRotateKeys() {
//     this.keys.sk.noStroke();
//     this.keys.sk.fill(150);
//     // TODO: update below
//     this.sk.text(this.data.rotate[0] + this.data.rotate[1], this.xPos, this.data.height);
// }

// overRotateKeys() {
//     //if (this.keys.overRect(this.xPos, this.data.height, this.keys.sk.textWidth("rotate left  "), this.rotatePanel.spacing)) this.sk.sketchController.updateRotationModeLeft();
//     //else if (this.keys.overRect(this.xPos + this.sk.textWidth("rotate left  "), this.rotatePanel.height, this.sk.textWidth("rotate right  "), this.rotatePanel.spacing)) this.sk.sketchController.updateRotationModeRight();
// }