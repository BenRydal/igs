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
            this.sk.loop(); // rerun P5 draw loop after loading image
            this.img = img;
            this.width = img.width;
            this.height = img.height;
        }, e => {
            alert("Error loading floor plan image file. Please make sure it is correctly formatted as a PNG or JPG image file.")
            console.log(e);
        });
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