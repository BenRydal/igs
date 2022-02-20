class Handle3D {
    /**
     * Class holds variables and methods that control 3D view and transitioning between 2D and 3D views
     */
    constructor(sketch, is3DMode) {
        this.sk = sketch;
        this.is3DMode = is3DMode;
        this.isTransitioning = false;
        this.translate = {
            zoom: -(this.sk.height / 1.5),
            xPos: this.sk.width / 4,
            yPos: this.sk.height / 1.75,
            rotateX: this.sk.PI / 2.3
        }
        this.curTranslatePos = {
            zoom: this.translate.zoom,
            xPos: this.translate.xPos,
            yPos: this.translate.yPos,
            rotateX: this.translate.rotateX
        }
    }

    update3DTranslation() {
        if (this.isTransitioning) {
            if (this.is3DMode) this.isTransitioning = this.updatePositions();
            else this.isTransitioning = this.resetPositions();
            this.translateFor3D(this.getCurTranslatePos());
        } else {
            if (this.is3DMode) this.translateFor3D(this.getCurTranslatePos());
        }
    }

    translateFor3D(curPos) {
        this.sk.push();
        this.sk.translate(curPos.xPos, curPos.yPos, curPos.zoom);
        this.sk.rotateX(curPos.rotateX);
    }

    updatePositions() {
        let isRunning = false;
        this.curTranslatePos.zoom = this.translate.zoom;
        if (this.curTranslatePos.rotateX < this.translate.rotateX) {
            this.curTranslatePos.rotateX += .03;
            isRunning = true;
        }
        if (this.curTranslatePos.xPos < this.translate.xPos) {
            this.curTranslatePos.xPos += 10;
            isRunning = true;
        }
        if (this.curTranslatePos.yPos < this.translate.yPos) {
            this.curTranslatePos.yPos += 10;
            isRunning = true;
        }
        return isRunning;
    }

    resetPositions() {
        this.curTranslatePos.rotateX = 0;
        this.curTranslatePos.xPos = 0;
        this.curTranslatePos.yPos = 0;
        this.curTranslatePos.zoom = 0;
        return false;
    }

    toggleIsShowing() {
        this.is3DMode = !this.is3DMode;
    }

    setIsTransitioning(value) {
        this.isTransitioning = value;
    }

    getIs3DMode() {
        return this.is3DMode;
    }

    getIsTransitioning() {
        return this.isTransitioning;
    }

    getCurTranslatePos() {
        return this.curTranslatePos;
    }
}