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

    getParams() {
        return {
            width: this.width,
            height: this.height
        }
    }

    clear() {
        this.img = null;
        this.width = null;
        this.height = null;
    }
}