class SetData {

    /**
     * Organizes drawing methods for movement and conversation drawData classes
     * Also organizes drawing of slicer line, conversation bubble if selected by user, and updating core.isModeAnimate
     */
    setMovementAndConversationData() {
        let drawConversationData = new DrawDataConversation();
        let drawMovementData = new DrawDataMovement();
        for (let i = 0; i < core.paths.length; i++) {
            if (core.paths[i].show) {
                drawConversationData.setData(core.paths[i]);
                drawMovementData.setData(core.paths[i]); // draw after conversation so bug displays on top
            }
        }
        if (overRect(keys.timelineStart, 0, keys.timelineLength, keys.timelineHeight)) drawMovementData.drawSlicer(); // draw slicer line after calculating all movement
        drawConversationData.setConversationBubble(); // draw conversation text last so it displays on top
        if (core.isModeAnimate) this.setUpAnimation();
    }

    /**
     * Organizes drawing methods for movement drawData class only
     * Also organizes drawing of slicer line and updating core.isModeAnimate
     */
    setMovementData() {
        let drawMovementData = new DrawDataMovement();
        for (let i = 0; i < core.paths.length; i++) {
            if (core.paths[i].show) drawMovementData.setData(core.paths[i]); // draw after conversation so bug displays on top
        }
        if (overRect(keys.timelineStart, 0, keys.timelineLength, keys.timelineHeight)) drawMovementData.drawSlicer(); // draw slicer line after calculating all movement
        if (core.isModeAnimate) this.setUpAnimation();
    }

    /**
     * Updates global core.isModeAnimate counter to control core.isModeAnimate or sets core.isModeAnimate to false if core.isModeAnimate complete
     */
    setUpAnimation() {
        let animationIncrementRateDivisor = 1000; // this seems to work best
        // Get amount of time in seconds currently displayed
        let curTimeIntervalInSeconds = map(keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd, 0, core.totalTimeInSeconds) - map(keys.curPixelTimeMin, keys.timelineStart, keys.timelineEnd, 0, core.totalTimeInSeconds);
        // set increment value based on that value/divisor to keep constant core.isModeAnimate speed regardless of time interval selected
        let animationIncrementValue = curTimeIntervalInSeconds / animationIncrementRateDivisor;
        if (core.animationCounter < map(keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd, 0, core.totalTimeInSeconds)) core.animationCounter += animationIncrementValue; // updates core.isModeAnimate
        else core.isModeAnimate = false;
    }

    /**
     * Updates time selected in video depending on mouse position or core.isModeAnimate over timeline
     */
    setVideoScrubbing() {
        if (core.isModeAnimate) {
            let startValue = map(keys.curPixelTimeMin, keys.timelineStart, keys.timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())); // remap starting point to seek for video
            let endValue = map(keys.curPixelTimeMax, keys.timelineStart, keys.timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())); // remap starting point to seek for video
            let vPos = Math.floor(map(core.bugTimePosForVideoScrubbing, keys.timelineStart, keys.timelineEnd, startValue, endValue));
            videoPlayer.seekTo(vPos);
        } else if (overRect(keys.timelineStart, 0, keys.timelineEnd, keys.timelineHeight)) {
            let mPos = map(mouseX, keys.timelineStart, keys.timelineEnd, keys.curPixelTimeMin, keys.curPixelTimeMax); // first map mouse to selected time values in GUI
            // must floor vPos to prevent double finite error
            let vPos = Math.floor(map(mPos, keys.timelineStart, keys.timelineEnd, 0, Math.floor(videoPlayer.getVideoDuration())));
            videoPlayer.seekTo(vPos);
            videoPlayer.pause(); // Add to prevent accidental video playing that seems to occur
        }
    }
}