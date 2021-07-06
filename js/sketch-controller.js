/*
IGS (move core booleans here with getters/setters)
- core (holds program data and update methods)
- processData (handles parsing/processing of CSVs)
- keys (GUI position vars, draw methods)
- p5controller? (boolean modes, handlers)
- drawData (testSketch?)

Controller

TestData

TODO: update parameters in all data calls, textFont/textSize?
Move videoIsShowing/playing and overvideobutton into videoPlayer?

    // all the "set methods" THEN p5 sketch itself deals with all the mouse handling??
    // setters/getters still all in here SO this is where things change and sketch is where flow is handled

    // NEED getters/setters for all modes!--COULD have one for array?
    // COULD pass keys object/videoPlayer reference to all of these methods???
*/

class SketchController {

    setAlignTalk(value) {
        mode.isAlignTalk = value;
    }

    setAllTalk(value) {
        mode.isAllTalk = value;
    }

    setIntro(value) {
        mode.isIntro = value;
    }

    handleMousePressed() {
        // Controls video when clicking over timeline region
        if (mode.isVideoShow && !mode.isAnimate && keys.overRect(keys.timeline.start, 0, keys.timeline.end, keys.timeline.bottom)) this.playPauseMovie();
        keys.overMovementConversationButtons();
        if (mode.isMovement) keys.overPathKeys();
        else keys.overSpeakerKeys();
    }

    handleMouseDragged() {
        if (!mode.isAnimate && ((keys.timeline.isLockedLeft || keys.timeline.isLockedRight) || keys.overRect(keys.timeline.start - keys.timeline.padding, keys.timeline.top, keys.timeline.length + keys.timeline.padding, keys.timeline.thickness))) keys.handleTimeline();

    }

    handleMouseReleased() {
        keys.timeline.isLockedLeft = false;
        keys.timeline.isLockedRight = false;
    }

    /**
     * Toggle on and off mode.isAnimate mode and set/end global mode.isAnimate counter variable
     */
    overAnimateButton() {
        if (mode.isAnimate) {
            mode.isAnimate = false;
            animationCounter = map(keys.timeline.selectEnd, keys.timeline.start, keys.timeline.end, 0, core.totalTimeInSeconds); // set to keys.timeline.selectEnd mapped value
        } else {
            mode.isAnimate = true;
            animationCounter = map(keys.timeline.selectStart, keys.timeline.start, keys.timeline.end, 0, core.totalTimeInSeconds); // set to keys.timeline.selectStart mapped value
        }
    }

    /**
     * Toggle whether video is playing and whether video is showing
     * NOTE: this is different than playPauseMovie method
     */
    overVideoButton() {
        if (mode.isVideoShow) {
            core.videoPlayer.pause();
            core.videoPlayer.hide();
            mode.isVideoPlay = false; // important to set this
        } else {
            core.videoPlayer.show();
        }
        mode.isVideoShow = !mode.isVideoShow; // set after testing
    }

    /**
     * Plays/pauses movie and updates videoPlayhead if setting to play
     * Also toggles global mode.isVideoPlay variable
     */
    playPauseMovie() {
        if (mode.isVideoPlay) {
            core.videoPlayer.pause();
            mode.isVideoPlay = false;
        } else {
            // first map mouse to selected time values in GUI
            const mapMousePos = map(mouseX, keys.timeline.start, keys.timeline.end, keys.timeline.selectStart, keys.timeline.selectEnd);
            // must floor vPos to prevent double finite error
            const videoPos = Math.floor(map(mapMousePos, keys.timeline.start, keys.timeline.end, 0, Math.floor(core.videoPlayer.getVideoDuration())));
            core.videoPlayer.play();
            core.videoPlayer.seekTo(videoPos);
            mode.isVideoPlay = true;
        }
    }
}