/**
 * This class handles updating various DOM UI elements. Methods are called from DomHandler and Core classes.
 */

export class DomController {

    constructor(sketch) {
        this.sk = sketch;
    }

    showLoadDataButtons() {
        const elementList = document.querySelectorAll(".js-main-menu-bar__load-files--display");
        elementList.forEach(element => element.style.display = 'inline');
    }

    hideLoadDataButtons() {
        const elementList = document.querySelectorAll(".js-main-menu-bar__load-files--display");
        elementList.forEach(element => element.style.display = 'none');
    }

    resetColorModeButton() {
        document.getElementById('sub-tab8-1').checked = false; // reset color code button
        this.updateColorModeLabel();
        this.toggleColorChangeButtons();
    }

    updateColorModeLabel() {
        const element = document.getElementById('sub-tab8-1');
        if (element.checked) element.labels[0].innerHTML = 'Color By Paths';
        else element.labels[0].innerHTML = 'Color By Codes';
    }

    /**
     * Resets text, display and checked properties for each color change button
     * NOTE: .labels returns nodeList so access first element to update label for each input
     */
    toggleColorChangeButtons() {
        const elementList = document.querySelectorAll(".js-color-change"); // get all input elements for each button
        elementList.forEach(function(element) {
            element.checked = false; // reset input element checked value
            element.labels[0].innerHTML = 'Change Color'; // reset text for label of input
            if (element.labels[0].style.display === 'none') { // toggle display
                element.labels[0].style.display = 'block';
                element.labels[0].style.cssFloat = 'right';
            } else {
                element.labels[0].style.display = 'none';
            }
        });
    }

    updateSubTab(isChecked, subTab) {
        if (isChecked) this.updateColorPickers(subTab);
        else this.updateCheckboxes(subTab);
    }

    updateCheckboxes(subTab) {
        switch (subTab) {
            case "movement":
                this.clearCheckboxes("sub-tab1-1", "input-class-movement");
                for (const coreDataItem of this.sk.core.pathList) this.createCheckbox(coreDataItem, "movement-main-tab", "input-class-movement");
                break;
            case "talk":
                this.clearCheckboxes("sub-tab3-4", "input-class-talk");
                for (const coreDataItem of this.sk.core.speakerList) this.createCheckbox(coreDataItem, "talk-main-tab", "input-class-talk");
                break;
            case "codes":
                this.clearCheckboxes("sub-tab8-2", "input-class-code");
                for (const coreDataItem of this.sk.core.codeList) this.createCheckbox(coreDataItem, "codes-main-tab", "input-class-code");
                break;
        }
    }

    updateColorPickers(subTab) {
        switch (subTab) {
            case "movement":
                this.clearColorPickers("sub-tab1-1", "input-class-movement");
                for (const coreDataItem of this.sk.core.pathList) this.createColorPicker(coreDataItem, "movement-main-tab", "input-class-movement");
                break;
            case "talk":
                this.clearColorPickers("sub-tab3-4", "input-class-talk");
                for (const coreDataItem of this.sk.core.speakerList) this.createColorPicker(coreDataItem, "talk-main-tab", "input-class-talk");
                break;
            case "codes":
                this.clearColorPickers("sub-tab8-2", "input-class-code");
                for (const coreDataItem of this.sk.core.codeList) this.createColorPicker(coreDataItem, "codes-main-tab", "input-class-code");
                break;
        }
    }

    updateAllCheckboxes() {
        this.updateCheckboxes("movement");
        this.updateCheckboxes("talk");
        this.updateCheckboxes("codes");
    }


    /**
     * CreateCheckbox/CreateColorPicker create elements that have same styles but have different input types
     * and event listeners.
     */
    createCheckbox(coreDataItem, mainTabClass, inputClass) {
        let [div, span] = this.createSubTabElement(mainTabClass, coreDataItem, inputClass, "checkbox");
        let curColor;
        if (this.sk.sketchController.getIsPathColorMode()) curColor = coreDataItem.color.pathMode;
        else curColor = coreDataItem.color.codeMode;
        span.classList.add("checkmark", inputClass);
        span.style.border = "medium solid" + curColor;
        if (coreDataItem.isShowing) {
            span.style.backgroundColor = curColor;
            div.checked = true;
        } else {
            span.style.backgroundColor = "";
            div.checked = false;
        }
        div.addEventListener('change', () => this.toggleCheckboxAndData(coreDataItem, span));
    }

    createColorPicker(coreDataItem, mainTabClass, inputClass) {
        let [div, span] = this.createSubTabElement(mainTabClass, coreDataItem, inputClass, "color");
        if (this.sk.sketchController.getIsPathColorMode()) div.value = coreDataItem.color.pathMode;
        else div.value = coreDataItem.color.codeMode;
        span.classList.add("colorpicker", inputClass);
        span.style.border = "medium solid" + div.value;
        span.style.backgroundColor = div.value;
        div.addEventListener('input', () => this.toggleColorPickerAndData(coreDataItem, div, span));
    }

    createSubTabElement(mainTabClass, coreDataItem, inputClass, inputDivType) {
        let parent = document.getElementById(mainTabClass); // Get parent tab to append new div and label to
        let label = document.createElement('label'); //  Make label
        let div = document.createElement('input'); // Make checkbox div
        let span = document.createElement('span'); // Make span to hold new checkbox styles
        label.textContent = coreDataItem.name; // set name to text of path
        label.classList.add("tab-checkbox", inputClass);
        div.setAttribute("type", inputDivType);
        div.classList.add(inputClass);
        label.appendChild(div);
        label.appendChild(span);
        parent.appendChild(label);
        return [div, span];
    }

    /**
     * Updates checkbox display and also corresponding core program data
     * NOTE: both toggle methods alter core program data. This is not ideal but is the best solution for now.
     */
    toggleCheckboxAndData(coreDataItem, span) {
        coreDataItem.isShowing = !coreDataItem.isShowing; // update isShowing for path
        if (coreDataItem.isShowing) {
            if (this.sk.sketchController.getIsPathColorMode()) span.style.backgroundColor = coreDataItem.color.pathMode;
            else span.style.backgroundColor = coreDataItem.color.codeMode;
        } else span.style.backgroundColor = "";
        this.sk.loop();
    }

    /**
     * To update for codeMode, iterate through all points in a path and update code color for each point if it is being changed in GUI
     * TODO: should this method also iterate through points in path.conversation?
     */
    toggleColorPickerAndData(coreDataItem, div, span) {
        if (this.sk.sketchController.getIsPathColorMode()) coreDataItem.color.pathMode = div.value;
        else {
            for (const path of this.sk.core.pathList) {
                for (const point of path.movement) {
                    if (point.codes.color === coreDataItem.color.codeMode) point.codes.color = div.value;
                }
            }
            coreDataItem.color.codeMode = div.value; // update codeMode to show properly in GUI
        }
        span.style.backgroundColor = div.value;
        span.style.border = "medium solid" + div.value;
        this.sk.loop();
    }

    clearAllCheckboxes() {
        this.clearCheckboxes("sub-tab1-1", "input-class-movement");
        this.clearCheckboxes("sub-tab3-4", "input-class-talk");
        this.clearCheckboxes("sub-tab8-2", "input-class-code");
    }

    clearCheckboxes(inputID, inputClass) {
        const element = document.getElementById(inputID);
        element.checked = false; // reset input checkbox checked attribute
        element.labels[0].innerHTML = 'Change Color'; // reset text for label of input
        this.removeAllElements(inputClass);
    }

    clearColorPickers(inputID, colorPickerClass) {
        const element = document.getElementById(inputID);
        element.checked = true; // reset input checkbox checked attribute
        element.labels[0].innerHTML = 'Set Color'; // reset text for label of input
        this.removeAllElements(colorPickerClass);
    }

    removeAllElements(elementId) {
        let elementList = document.querySelectorAll("." + elementId);
        elementList.forEach(function(userItem) {
            userItem.remove();
        });
    }

    // Return inverse value as higher values cause animation to run slower and you want the inverse of this to be true
    getAnimateSliderValue() {
        const animateSlider = document.getElementById("animate-speed-slider");
        return animateSlider.max - animateSlider.value;
    }
}