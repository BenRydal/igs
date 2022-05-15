class DomController {

    constructor(sketch) {
        this.sk = sketch;
    }


    resetColorCodeButton() {
        document.getElementById('sub-tab8-1').checked = false; // reset color code button
        this.updateColorModeButtonText(false)
    }

    updateColorModeButtonText(isChecked) {
        if (isChecked) document.getElementById('label-toggle-color-mode').innerHTML = 'Color By Paths';
        else document.getElementById('label-toggle-color-mode').innerHTML = 'Color By Codes';
    }

    /**
     * Resets buttons/GUI when color by codes button is pressed
     */
    updateColorCodesButton(isChecked) {
        this.updateColorModeButtonText(isChecked);
        this.sk.sketchController.toggleIsPathColorMode();
        this.toggleColorChangeButtons();
        this.updateCheckboxList("movement");
        this.updateCheckboxList("talk");
        this.updateCheckboxList("codes");

    }

    /**
     * Resets text, display and checked properties for each color change button
     * NOTE: .labels returns nodeList so access first element to update label for each input
     */
    toggleColorChangeButtons() {
        let elementList = document.querySelectorAll(".changeColorButton"); // get all input elements for each button
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

    updateMovementColorChangeButton(isChecked) {
        if (isChecked) this.updateColorPickerList(this.sk.core.pathList, "movementMainTab", "checkbox-movement", "label-color-movement");
        else this.updateCheckboxList("movement");
    }

    updateTalkColorChangeButton(isChecked) {
        if (isChecked) this.updateColorPickerList(this.sk.core.speakerList, "conversationMainTab", "checkbox-conversation", "label-color-talk");
        else this.updateCheckboxList("talk");
    }

    updateCodeColorChangeButton(isChecked) {
        if (isChecked) this.updateColorPickerList(this.sk.core.codeList, "codesMainTab", "checkbox-code", "label-color-code");
        else this.updateCheckboxList("codes");
    }


    updateCheckboxList(subTab) {
        switch (subTab) {
            case "movement":
                document.getElementById("label-color-movement").innerHTML = 'Change Color';
                this.removeAllElements("checkbox-movement");
                for (const item of this.sk.core.pathList) this.createCheckbox(item, "movementMainTab", "checkbox-movement");
                break;
            case "talk":
                document.getElementById("label-color-talk").innerHTML = 'Change Color';
                this.removeAllElements("checkbox-conversation");
                for (const item of this.sk.core.speakerList) this.createCheckbox(item, "conversationMainTab", "checkbox-conversation");
                break;
            case "codes":
                document.getElementById("label-color-code").innerHTML = 'Change Color';
                this.removeAllElements("checkbox-code");
                for (const item of this.sk.core.codeList) this.createCheckbox(item, "codesMainTab", "checkbox-code");
                break;
        }
    }

    // TODO: consider updating checkboxClass name
    updateColorPickerList(list, elementId, checkboxClass, labelID) {
        document.getElementById(labelID).innerHTML = 'Set Color';
        this.removeAllElements(checkboxClass);
        for (const item of list) this.createColorPicker(item, elementId, checkboxClass);
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

    clearAllCheckboxes() {
        this.removeAllElements("checkbox-movement");
        this.removeAllElements("checkbox-conversation");
        this.removeAllElements("checkbox-code");
    }

    removeAllElements(elementId) {
        let elementList = document.querySelectorAll("." + elementId);
        elementList.forEach(function (userItem) {
            userItem.remove();
        });
    }
}