class InputFloorPlan {

    constructor(sk) {
        this.sk = sk;
        this.img = null;
        this.width = null;
        this.height = null;
        this.curFloorPlanRotation = 1; // [0-3] 4 rotation modes none, 90, 180, 270
    }

    /**
     * Creates P5 image file from path and updates core floorPlan image and input width/heights to properly scale and display data
     * @param  {String} filePath
     */
    update(filePath) {
        this.sk.loadImage(filePath, img => {
            console.log("Floor Plan Image Loaded");
            this.img = img;
            this.width = img.width;
            this.height = img.height;
            this.sk.loop(); // rerun P5 draw loop after loading image
        }, e => {
            alert("Error loading floor plan image file. Please make sure it is correctly formatted as a PNG or JPG image file.")
            console.log(e);
        });
    }

    /**
     * Organizes floor plan drawing methods with correct rotation angle and corresponding width/height that vary bsed on rotation angle
     */
    setFloorPlan(container) {
        switch (this.curFloorPlanRotation) {
            case 0:
                this.draw(container.width, container.height);
                break;
            case 1:
                this.rotateAndDraw(this.sk.HALF_PI, container.height, container.width, container);
                break;
            case 2:
                this.rotateAndDraw(this.sk.PI, container.width, container.height, container);
                break;
            case 3:
                this.rotateAndDraw(-this.sk.HALF_PI, container.height, container.width, container);
                break;
        }
    }

    /**
     * Converts x/y pixel positions from data point to floor plan depending on floor plan rotation mode
     * @param  {Float} xPos
     * @param  {Float} yPos
     */
    getScaledXYPos(xPos, yPos, container) {
        let scaledXPos, scaledYPos;
        switch (this.curFloorPlanRotation) {
            case 0:
                scaledXPos = xPos * container.width / this.img.width;
                scaledYPos = yPos * container.height / this.img.height;
                return [scaledXPos, scaledYPos];
            case 1:
                scaledXPos = container.width - (yPos * container.width / this.img.height);
                scaledYPos = xPos * container.height / this.img.width;
                return [scaledXPos, scaledYPos];
            case 2:
                scaledXPos = container.width - (xPos * container.width / this.img.width);
                scaledYPos = container.height - (yPos * container.height / this.img.height);
                return [scaledXPos, scaledYPos];
            case 3:
                scaledXPos = yPos * container.width / this.img.height;
                scaledYPos = container.height - xPos * container.height / this.img.width;
                return [scaledXPos, scaledYPos];
        }
    }

    setRotateRight() {
        this.curFloorPlanRotation++;
        if (this.curFloorPlanRotation > 3) this.curFloorPlanRotation = 0;
    }

    setRotateLeft() {
        this.curFloorPlanRotation--;
        if (this.curFloorPlanRotation < 0) this.curFloorPlanRotation = 3;
    }

    /**
     * NOTE: When drawing floor plan, translate down on z axis -1 pixel so shapes are drawn cleanly on top of the floor plan
     */
    draw(width, height) {
        if (this.sk.sketchController.handle3D.getIsShowing()) {
            this.sk.push();
            this.sk.translate(0, 0, -1);
            this.sk.image(this.img, 0, 0, width, height);
            this.sk.pop();
        } else this.sk.image(this.img, 0, 0, width, height);
    }

    rotateAndDraw(angle, width, height, container) {
        this.sk.push();
        this.sk.imageMode(this.sk.CENTER); // important method to include here
        this.sk.translate(container.width / 2, container.height / 2);
        this.sk.rotate(angle);
        this.draw(width, height);
        this.sk.pop();
    }

    getImg() {
        return this.img;
    }

    clear() {
        this.img = null;
        this.width = null;
        this.height = null;
    }
}