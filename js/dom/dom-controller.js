class DomController {

    constructor(sketch) {
        this.sk = sketch;
    }

    updateMovementCheckboxes(pathList) {
        this.updateCheckboxList(pathList, "movementMainTab", "checkbox-movement");
    }

    updateConversationCheckboxes(speakerList) {
        this.updateCheckboxList(speakerList, "conversationMainTab", "checkbox-conversation");
    }

    updateCodeCheckboxes(codeList) {
        this.updateCheckboxList(codeList, "codesMainTab", "checkbox-code");
    }

    /**
     * Resets buttons/GUI when color by codes button is pressed
     */
    updateColorCodesButton(isChecked) {
        if (isChecked) document.getElementById('label-color-by-codes').innerHTML = 'Color By Paths';
        else document.getElementById('label-color-by-codes').innerHTML = 'Color By Codes';
        this.sk.sketchController.toggleIsPathColorMode();
        this.toggleColorChangeButtons();
        this.updateCheckboxList(this.sk.core.pathList, "movementMainTab", "checkbox-movement");
        this.updateCheckboxList(this.sk.core.speakerList, "conversationMainTab", "checkbox-conversation");
        this.updateCheckboxList(this.sk.core.codeList, "codesMainTab", "checkbox-code");
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
        if (isChecked) {
            document.getElementById('label-color-movement').innerHTML = 'Set Color';
            this.updateColorPickerList(this.sk.core.pathList, "movementMainTab", "checkbox-movement");
        } else {
            document.getElementById('label-color-movement').innerHTML = 'Change Color';
            this.updateCheckboxList(this.sk.core.pathList, "movementMainTab", "checkbox-movement");
        }
    }

    updateTalkColorChangeButton(isChecked) {
        if (isChecked) {
            document.getElementById('label-color-talk').innerHTML = 'Set Color';
            this.updateColorPickerList(this.sk.core.speakerList, "conversationMainTab", "checkbox-conversation");
        } else {
            document.getElementById('label-color-talk').innerHTML = 'Change Color';
            this.updateCheckboxList(this.sk.core.speakerList, "conversationMainTab", "checkbox-conversation");
        }
    }

    updateCodeColorChangeButton(isChecked) {
        if (isChecked) {
            document.getElementById('label-color-code').innerHTML = 'Set Color';
            this.updateColorPickerList(this.sk.core.codeList, "codesMainTab", "checkbox-code");
        } else {
            document.getElementById('label-color-code').innerHTML = 'Change Color';
            this.updateCheckboxList(this.sk.core.codeList, "codesMainTab", "checkbox-code");
        }
    }


    updateCheckboxList(list, elementId, checkboxClass) {
        this.removeAllElements(checkboxClass);
        for (const item of list) this.createCheckbox(item, elementId, checkboxClass);
    }
    // TODO: consider updating checkboxClass name
    updateColorPickerList(list, elementId, checkboxClass) {
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
            else curItem.color.codeMode = div.value;
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