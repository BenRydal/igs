class DomController {

    constructor(sketch) {
        this.sk = sketch;
    }

    updateColorMode(isChecked) {
        this.updateColorModeLabel(isChecked);
        this.sk.sketchController.toggleIsPathColorMode();
        this.toggleColorChangeButtons();
        this.updateCheckboxList("movement");
        this.updateCheckboxList("talk");
        this.updateCheckboxList("codes");

    }


    resetColorMode() {
        document.getElementById('sub-tab8-1').checked = false; // reset color code button
        this.updateColorModeLabel(false);
    }

    updateColorModeLabel(isChecked) {
        if (isChecked) document.getElementById('js-color-mode').innerHTML = 'Color By Paths';
        else document.getElementById('js-color-mode').innerHTML = 'Color By Codes';
    }

    /**
     * Resets text, display and checked properties for each color change button
     * NOTE: .labels returns nodeList so access first element to update label for each input
     */
    toggleColorChangeButtons() {
        const elementList = document.querySelectorAll(".js-color-change"); // get all input elements for each button
        elementList.forEach(function (element) {
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

    updateCheckboxList(subTab) {
        switch (subTab) {
            case "movement":
                this.clearCheckboxes("sub-tab1-1", "checkbox-movement");
                for (const item of this.sk.core.pathList) this.createCheckbox(item, "movementMainTab", "checkbox-movement");
                break;
            case "talk":
                this.clearCheckboxes("sub-tab3-3", "checkbox-conversation");
                for (const item of this.sk.core.speakerList) this.createCheckbox(item, "conversationMainTab", "checkbox-conversation");
                break;
            case "codes":
                this.clearCheckboxes("sub-tab8-2", "checkbox-code");
                for (const item of this.sk.core.codeList) this.createCheckbox(item, "codesMainTab", "checkbox-code");
                break;
        }
    }

    // TODO: consider updating checkboxClass name
    updateColorPickerList(subTab) {
        switch (subTab) {
            case "movement":
                this.clearColorPickers("sub-tab1-1", "checkbox-movement");
                for (const item of this.sk.core.pathList) this.createColorPicker(item, "movementMainTab", "checkbox-movement");
                break;
            case "talk":
                this.clearColorPickers("sub-tab3-3", "checkbox-conversation");
                for (const item of this.sk.core.speakerList) this.createColorPicker(item, "conversationMainTab", "checkbox-conversation");
                break;
            case "codes":
                this.clearColorPickers("sub-tab8-2", "checkbox-code");
                for (const item of this.sk.core.codeList) this.createColorPicker(item, "codesMainTab", "checkbox-code");
                break;
        }
    }

    clearAllCheckboxes() {
        this.clearCheckboxes("sub-tab1-1", "checkbox-movement");
        this.clearCheckboxes("sub-tab3-3", "checkbox-conversation");
        this.clearCheckboxes("sub-tab8-2", "checkbox-code");
    }

    clearCheckboxes(inputID, checkboxClass) {
        const element = document.getElementById(inputID);
        element.checked = false; // reset input checkbox checked attribute
        element.labels[0].innerHTML = 'Change Color'; // reset text for label of input
        this.removeAllElements(checkboxClass);
    }

    clearColorPickers(inputID, colorPickerClass) {
        const element = document.getElementById(inputID);
        element.checked = true; // reset input checkbox checked attribute
        element.labels[0].innerHTML = 'Set Color'; // reset text for label of input
        this.removeAllElements(colorPickerClass);
    }

    createCheckbox(curItem, mainTabClass, checkboxClass) {
        let parent = document.getElementById(mainTabClass); // Get parent tab to append new div and label to
        let label = document.createElement('label'); //  Make label
        let div = document.createElement('input'); // Make checkbox div
        let span = document.createElement('span'); // Make span to hold new checkbox styles
        let curColor;
        if (this.sk.sketchController.getIsPathColorMode()) curColor = curItem.color.pathMode;
        else curColor = curItem.color.codeMode;
        label.textContent = curItem.name; // set name to text of path
        label.classList.add("tab-checkbox", checkboxClass);
        div.setAttribute("type", "checkbox");
        div.classList.add(checkboxClass);
        span.classList.add("checkmark", checkboxClass);
        span.style.border = "medium solid" + curColor;
        if (curItem.isShowing) {
            span.style.backgroundColor = curColor;
            div.checked = true;
        } else {
            span.style.backgroundColor = "";
            div.checked = false;
        }
        div.addEventListener('change', () => {
            curItem.isShowing = !curItem.isShowing; // update isShowing for path
            if (curItem.isShowing) {
                if (this.sk.sketchController.getIsPathColorMode()) span.style.backgroundColor = curItem.color.pathMode;
                else span.style.backgroundColor = curItem.color.codeMode;
            } else span.style.backgroundColor = "";
            this.sk.loop();
        });
        label.appendChild(div);
        label.appendChild(span);
        parent.appendChild(label);
    }

    createColorPicker(curItem, mainTabClass, checkboxClass) {
        let parent = document.getElementById(mainTabClass); // Get parent tab to append new div and label to
        let label = document.createElement('label'); //  Make label
        let div = document.createElement('input'); // Make checkbox div
        let span = document.createElement('span'); // Make span to hold new checkbox styles
        label.textContent = curItem.name; // set name to text of path
        label.classList.add("tab-checkbox", checkboxClass); // TODO: update
        div.setAttribute("type", "color");
        div.classList.add(checkboxClass);
        if (this.sk.sketchController.getIsPathColorMode()) div.value = curItem.color.pathMode;
        else div.value = curItem.color.codeMode;
        span.classList.add("colorpicker", checkboxClass);
        span.style.border = "medium solid" + div.value;
        span.style.backgroundColor = div.value;
        div.addEventListener('input', () => {
            if (this.sk.sketchController.getIsPathColorMode()) curItem.color.pathMode = div.value;
            else {
                // TODO: update code color for all movement points in each path corresponding to code being updated in GUI
                for (const path of this.sk.core.pathList) {
                    for (const point of path.movement) {
                        if (point.codes.color === curItem.color.codeMode) point.codes.color = div.value;
                    }
                }
                curItem.color.codeMode = div.value; // update codeMode to show properly in GUI
            }
            span.style.backgroundColor = div.value;
            span.style.border = "medium solid" + div.value;
            this.sk.loop();
        });
        label.appendChild(div);
        label.appendChild(span);
        parent.appendChild(label);
    }

    removeAllElements(elementId) {
        let elementList = document.querySelectorAll("." + elementId);
        elementList.forEach(function (userItem) {
            userItem.remove();
        });
    }
}