class InputFloorPlan {

    constructor(sk) {
        this.sk = sk;
        this.img = null;
        this.width = null;
        this.height = null;
    }

    /**
     * Creates P5 image file from path and updates core floorPlan image and input width/heights to properly scale and display data
     * @param  {String} filePath
     */
    update(filePath) {
        this.sk.loadImage(filePath, img => {
            console.log("Floor Plan Image Loaded");
            img.onload = () => URL.revokeObjectURL(this.src);
            this.sk.sketchController.startLoop(); // rerun P5 draw loop after loading image
            this.img = img;
            this.width = img.width;
            this.height = img.height;
        }, e => {
            alert("Error loading floor plan image file. Please make sure it is correctly formatted as a PNG or JPG image file.")
            console.log(e);
        });
    }

    /**
     * Converts x/y pixel positions from data point to floor plan depending on floor plan rotation mode
     * @param  {Float} xPos
     * @param  {Float} yPos
     */
    getScaledXYPos(xPos, yPos, container, rotationMode) {
        let scaledXPos, scaledYPos;
        switch (rotationMode) {
            case 0:
                scaledXPos = xPos * container.width / this.width;
                scaledYPos = yPos * container.height / this.height;
                return [scaledXPos, scaledYPos];
            case 1:
                scaledXPos = container.width - (yPos * container.width / this.height);
                scaledYPos = xPos * container.height / this.width;
                return [scaledXPos, scaledYPos];
            case 2:
                scaledXPos = container.width - (xPos * container.width / this.width);
                scaledYPos = container.height - (yPos * container.height / this.height);
                return [scaledXPos, scaledYPos];
            case 3:
                scaledXPos = yPos * container.width / this.height;
                scaledYPos = container.height - xPos * container.height / this.width;
                return [scaledXPos, scaledYPos];
        }
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