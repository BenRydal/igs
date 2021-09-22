class Handle3D {
    /**
     * Class holds variables and methods that control 3D view and transitioning between 2D and 3D views
     */
    constructor(sketch) {
        this.sk = sketch;
        this.isShowing = true;
        this.isTransitioning = false;
        this.translate = {
            zoom: -(this.sk.height / 1.5),
            xPos: this.sk.width / 4,
            yPos: this.sk.height / 1.75,
            rotateX: this.sk.PI / 2.3
        }
        this.cur = {
            zoom: this.translate.zoom,
            xPos: this.translate.xPos,
            yPos: this.translate.yPos,
            rotateX: this.translate.rotateX
        }
    }

    update3DTranslation() {
        if (this.isTransitioning) {
            if (this.isShowing) this.isTransitioning = this.updatePositions();
            else this.isTransitioning = this.resetPositions();
            this.sk.translateCanvasTo3D(this.getCurPositions());
        } else {
            if (this.isShowing) this.sk.translateCanvasTo3D(this.getCurPositions());
        }
    }

    updatePositions() {
        let isRunning = false;
        this.cur.zoom = this.translate.zoom;
        if (this.cur.rotateX < this.translate.rotateX) {
            this.cur.rotateX += .03;
            isRunning = true;
        }
        if (this.cur.xPos < this.translate.xPos) {
            this.cur.xPos += 10;
            isRunning = true;
        }
        if (this.cur.yPos < this.translate.yPos) {
            this.cur.yPos += 10;
            isRunning = true;
        }
        return isRunning;
    }

    resetPositions() {
        this.cur.rotateX = 0;
        this.cur.xPos = 0;
        this.cur.yPos = 0;
        this.cur.zoom = 0;
        return false;
    }

    toggleIsShowing() {
        this.isShowing = !this.isShowing;
    }

    setIsTransitioning(value) {
        this.isTransitioning = value;
    }

    getIsShowing() {
        return this.isShowing;
    }

    getIsTransitioning() {
        return this.isTransitioning;
    }

    getCurPositions() {
        return this.cur;
    }
}