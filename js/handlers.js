class Handlers {

    constructor() {
        this.lockedLeft = false;
        this.lockedRight = false;
    }

    /**
     * Organizes mousePressed method calls for video, movement/conversation and interaction buttons and path/speaker keys
     */
    handleMousePressed() {
        // Controls video when clicking over timeline region
        if (videoIsShowing && !isAnimate && overRect(keys.timelineStart, 0, keys.timelineEnd, keys.yPosTimelineBottom)) this.playPauseMovie();
        this.overMovementConversationButtons();
        this.overInteractionButtons();
        if (isModeMovement) this.overPathKeys();
        else this.overSpeakerKeys();
    }

    /**
     * Organizes timeline GUI methods. SELPADDING used to provide additionl "cushion" for mouse.
     * NOTE: To activate timeline methods, isAnimate mode must be false and 
     * Either mouse already dragging over timeline OR mouse cursor is over timeline bar.
     */
    handleMouseDragged() {
        if (!isAnimate && ((this.lockedLeft || this.lockedRight) || overRect(keys.timelineStart - SELPADDING, keys.yPosTimelineTop, keys.timelineLength + SELPADDING, keys.timelineThickness))) this.handleTimeline();
    }

    /**
     * Set locked global vars to false to be able to re-engage timeline GUI methods
     */
    handleMouseReleased() {
        this.lockedLeft = false;
        this.lockedRight = false;
    }

    /**
     * Toggles on and off global showMovement var to determine if movement or conversation keys show
     * NOTE: textSize is way to control dynamic scaling for gui methods and interface
     */
    overMovementConversationButtons() {
        textSize(keys.keyTextSize);
        let currXPos = keys.timelineStart;
        if (overRect(currXPos, keys.speakerKeysHeight, keys.buttonWidth + textWidth("Movement"), keys.buttonWidth)) isModeMovement = true;
        else if (overRect(currXPos + textWidth("Movement | "), keys.speakerKeysHeight, keys.buttonWidth + textWidth("Conversation"), keys.buttonWidth)) isModeMovement = false;
    }

    /**
     * Iterate over global speakerList and test if mouse is over any of speaker keys and update speaker accordingly
     * NOTE: textSize is way to control dynamic scaling for gui methods and interface
     */
    overSpeakerKeys() {
        textSize(keys.keyTextSize);
        let currXPos = keys.timelineStart + textWidth("Movement | Conversation") + keys.buttonWidth;
        for (let i = 0; i < speakerList.length; i++) {
            let nameWidth = textWidth(speakerList[i].name); // set nameWidth to pixel width of speaker code
            if (overRect(currXPos, keys.speakerKeysHeight, keys.buttonWidth + nameWidth, keys.buttonWidth)) speakerList[i].show = !speakerList[i].show;
            currXPos += keys.buttonWidth + nameWidth + keys.buttonSpacing;
        }
    }

    /**
     * Iterate over global paths list and test if mouse is over any of paths and update accordingly
     * NOTE: textSize is way to control dynamic scaling for gui methods and interface
     */
    overPathKeys() {
        textSize(keys.keyTextSize);
        let currXPos = keys.timelineStart + textWidth("Movement | Conversation") + keys.buttonWidth;
        for (let i = 0; i < paths.length; i++) {
            const nameWidth = textWidth(paths[i].name); // set nameWidth to pixel width of path name
            if (overRect(currXPos, keys.speakerKeysHeight, keys.buttonWidth + nameWidth, keys.buttonWidth)) paths[i].show = !paths[i].show;
            currXPos += keys.buttonWidth + nameWidth + keys.buttonSpacing;
        }
    }

    /**
     * Iterate over each interaction button and toggle boolean or call corresponding gui method for button
     * NOTE: textSize is way to control dynamic scaling for gui methods and interface
     */
    overInteractionButtons() {
        textSize(keys.keyTextSize);
        let currXPos = keys.timelineStart + keys.buttonSpacing / 2;
        if (overRect(currXPos, keys.buttonsHeight, textWidth(buttons[0]), keys.buttonWidth)) this.overAnimateButton();
        else if (overRect(currXPos + textWidth(buttons[0]) + 2 * keys.buttonSpacing, keys.buttonsHeight, textWidth(buttons[1]) + keys.buttonSpacing, keys.buttonWidth)) isModeAlignTalkTop = !isModeAlignTalkTop;
        else if (overRect(currXPos + textWidth(buttons[0] + buttons[1]) + 4 * keys.buttonSpacing, keys.buttonsHeight, textWidth(buttons[2]) + keys.buttonSpacing, keys.buttonWidth)) isModeAllTalkOnPath = !isModeAllTalkOnPath;
        else if (dataIsLoaded(videoPlayer) && overRect(currXPos + textWidth(buttons[0] + buttons[1] + buttons[2]) + 6 * keys.buttonSpacing, keys.buttonsHeight, textWidth(buttons[3]) + keys.buttonSpacing, keys.buttonWidth)) this.overVideoButton();
        else if (overRect(currXPos + textWidth(buttons[0] + buttons[1] + buttons[2] + buttons[3]) + 8 * keys.buttonSpacing, keys.buttonsHeight, textWidth(buttons[4]) + keys.buttonSpacing, keys.buttonWidth)) isIntroMsg = !isIntroMsg;
    }

    /**
     * Toggle on and off isAnimate mode and set/end global isAnimate counter variable
     */
    overAnimateButton() {
        if (isAnimate) {
            isAnimate = false;
            animationCounter = map(keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd, 0, totalTimeInSeconds); // set to keys.curPixelTimeMax mapped value
        } else {
            isAnimate = true;
            animationCounter = map(keys.curPixelTimeMin, keys.timelineStart, keys.timelineEnd, 0, totalTimeInSeconds); // set to keys.curPixelTimeMin mapped value
        }
    }

    /**
     * Updates keys.curPixelTimeMin or keys.curPixelTimeMax global variables depending on left or right selector that user is over
     * NOTE: Is triggered if user already dragging or begins dragging
     */
    handleTimeline() {
        const xPosLeftSelector = keys.curPixelTimeMin;
        const xPosRightSelector = keys.curPixelTimeMax;
        if (this.lockedLeft || (!this.lockedRight && overRect(xPosLeftSelector - SELPADDING, keys.yPosTimelineTop, 2 * SELPADDING, keys.timelineThickness))) {
            this.lockedLeft = true;
            keys.curPixelTimeMin = constrain(mouseX, keys.timelineStart, keys.timelineEnd);
            if (keys.curPixelTimeMin > keys.curPixelTimeMax - (2 * SELPADDING)) keys.curPixelTimeMin = keys.curPixelTimeMax - (2 * SELPADDING); // prevents overstriking
        } else if (this.lockedRight || overRect(xPosRightSelector - SELPADDING, keys.yPosTimelineTop, 2 * SELPADDING, keys.timelineThickness)) {
            this.lockedRight = true;
            keys.curPixelTimeMax = constrain(mouseX, keys.timelineStart, keys.timelineEnd);
            if (keys.curPixelTimeMax < keys.curPixelTimeMin + (2 * SELPADDING)) keys.curPixelTimeMax = keys.curPixelTimeMin + (2 * SELPADDING); // prevents overstriking
        }
    }

    /**
     * Toggle whether video is playing and whether video is showing
     * NOTE: this is different than playPauseMovie method
     */
    overVideoButton() {
        if (videoIsShowing) {
            videoPlayer.pause();
            videoPlayer.hide();
            videoIsPlaying = false; // important to set this
        } else {
            videoPlayer.show();
        }
        videoIsShowing = !videoIsShowing; // set after testing
    }

    /**
     * Plays/pauses movie and updates videoPlayhead if setting to play
     * Also toggles global videoIsPlaying variable
     */
    playPauseMovie() {
        if (videoIsPlaying) {
            videoPlayer.pause();
            videoIsPlaying = false;
        } else {
            // first map mouse to selected time values in GUI
            const mapMousePos = map(mouseX, keys.timelineStart, keys.timelineEnd, keys.curPixelTimeMin, keys.curPixelTimeMax);
            // must floor vPos to prevent double finite error
            const videoPos = Math.floor(map(mapMousePos, keys.timelineStart, keys.timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())));
            videoPlayer.play();
            videoPlayer.seekTo(videoPos);
            videoIsPlaying = true;
        }
    }
}