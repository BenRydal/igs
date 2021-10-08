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
        this.curTranslate = {
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
        this.curTranslate.zoom = this.translate.zoom;
        if (this.curTranslate.rotateX < this.translate.rotateX) {
            this.curTranslate.rotateX += .03;
            isRunning = true;
        }
        if (this.curTranslate.xPos < this.translate.xPos) {
            this.curTranslate.xPos += 10;
            isRunning = true;
        }
        if (this.curTranslate.yPos < this.translate.yPos) {
            this.curTranslate.yPos += 10;
            isRunning = true;
        }
        return isRunning;
    }

    resetPositions() {
        this.curTranslate.rotateX = 0;
        this.curTranslate.xPos = 0;
        this.curTranslate.yPos = 0;
        this.curTranslate.zoom = 0;
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
        return this.curTranslate;
    }
}