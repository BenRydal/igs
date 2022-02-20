class HandleRotation {

    constructor(sketch) {
        this.sk = sketch;
        this.curFloorPlanRotation = 1; // [0-3] 4 rotation modes none, 90, 180, 270
    }

    /**
     * Organizes floor plan drawing methods with correct rotation angle and corresponding width/height that vary bsed on rotation angle
     */
    setFloorPlan(container) {
        switch (this.curFloorPlanRotation) {
            case 0:
                this.sk.inputFloorPlan.draw(container.width, container.height);
                break;
            case 1:
                this.sk.inputFloorPlan.rotateAndDraw(this.sk.HALF_PI, container.height, container.width, container);
                break;
            case 2:
                this.sk.inputFloorPlan.rotateAndDraw(this.sk.PI, container.width, container.height, container);
                break;
            case 3:
                this.sk.inputFloorPlan.rotateAndDraw(-this.sk.HALF_PI, container.height, container.width, container);
                break;
        }
    }

    /**
     * Converts x/y pixel positions from data point to floor plan depending on floor plan rotation mode
     * @param  {Float} xPos
     * @param  {Float} yPos
     */
    getScaledXYPos(xPos, yPos, container, input) {
        let scaledXPos, scaledYPos;
        switch (this.curFloorPlanRotation) {
            case 0:
                scaledXPos = xPos * container.width / input.width;
                scaledYPos = yPos * container.height / input.height;
                return [scaledXPos, scaledYPos];
            case 1:
                scaledXPos = container.width - (yPos * container.width / input.height);
                scaledYPos = xPos * container.height / input.width;
                return [scaledXPos, scaledYPos];
            case 2:
                scaledXPos = container.width - (xPos * container.width / input.width);
                scaledYPos = container.height - (yPos * container.height / input.height);
                return [scaledXPos, scaledYPos];
            case 3:
                scaledXPos = yPos * container.width / input.height;
                scaledYPos = container.height - xPos * container.height / input.width;
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
}