class View3D {
    /**
     * Class holds variables and methods that control 3D view and transitioning between 2D and 3D views
     */
    constructor(sketch) {
        this.sk = sketch;
        this.isShowing = false;
        this.zoom = -(this.sk.height / 1.5);
        this.curZoom = 0;
        this.isTransitioning = false;
        this.xPosTranslate = this.sk.width / 4;
        this.yPosTranslate = this.sk.height / 1.75;
        this.curXPos = 0;
        this.curYPos = 0;
        this.rotateX = this.sk.PI / 2.3;
        this.curRotateX = 0;
    }

    update3DTranslation() {
        if (this.isTransitioning) {
            if (this.isShowing) this.isTransitioning = this.updatePositions();
            else this.isTransitioning = this.resetPositions();
            this.sk.set3DCanvas(this.getCurPositions());
        } else {
            if (this.isShowing) this.sk.set3DCanvas(this.getCurPositions());
        }
    }

    getCurPositions() {
        return {
            xPos: this.curXPos,
            yPos: this.curYPos,
            zoom: this.curZoom,
            rotateX: this.curRotateX
        }
    }

    updatePositions() {
        let isRunning = false;
        this.curZoom = this.zoom;
        if (this.curRotateX < this.rotateX) {
            this.curRotateX += .03;
            isRunning = true;
        }
        if (this.curXPos < this.xPosTranslate) {
            this.curXPos += 10;
            isRunning = true;
        }
        if (this.curYPos < this.yPosTranslate) {
            this.curYPos += 10;
            isRunning = true;
        }
        return isRunning;
    }

    resetPositions() {
        this.curRotateX = 0;
        this.curXPos = 0;
        this.curYPos = 0;
        this.curZoom = 0;
        return false;
    }

    toggleIsShowing() {
        this.isShowing = !this.isShowing;
    }

    getIsShowing() {
        return this.isShowing;
    }

    setIsTransitioning(value) {
        this.isTransitioning = value;
    }

    getIsTransitioning() {
        return this.isTransitioning;
    }
}