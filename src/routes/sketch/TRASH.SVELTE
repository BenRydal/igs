{#if selectedTab == 'Talk'}
<input class="tab-radio" id="main-tab-3" name="main-group" type="radio">
<div class="tab-content loop-sketch" id="talk-main-tab">
    <div class="sub-tabs-container button-float">
        <input type="search" id="sub-tab3-1" name="search-input" placeholder="Search">
        <label for="sub-tab3-2" title="Align talk along top">Align</label>
        <label for="sub-tab3-3" title="Show talk by all speakers along each movement path">All On
            Path</label>
        <label for="sub-tab3-4" title="Click to change and set colors">Change
            Color</label>
    </div>
    <input class="tab-radio" id="sub-tab3-2" name="sub-group3" type="checkbox">
    <input class="tab-radio" id="sub-tab3-3" name="sub-group3" type="checkbox">
    <input class="tab-radio js-color-change" id="sub-tab3-4" name="sub-group3" type="checkbox">
</div>
{/if}
{#if selectedTab == 'Video'}
<input class="tab-radio" id="main-tab-4" name="main-group" type="radio">
<div class="tab-content loop-sketch">
    <div class="sub-tabs-container">
        <label for="sub-tab4-1">Show/Hide</label>
        <label for="sub-tab4-2">Play/Pause</label>
        <label for="sub-tab4-3">+</label>
        <label for="sub-tab4-4">-</label>
    </div>
    <input class="tab-radio" id="sub-tab4-1" name="sub-group4" type="checkbox">
    <input class="tab-radio" id="sub-tab4-2" name="sub-group4" type="checkbox">
    <input class="tab-radio" id="sub-tab4-3" name="sub-group4" type="checkbox">
    <input class="tab-radio" id="sub-tab4-4" name="sub-group4" type="checkbox">
</div>
{/if}
{#if selectedTab == 'Animate'}
<input class="tab-radio" id="main-tab-5" name="main-group" type="radio">
<div class="tab-content loop-sketch">
    <div class="sub-tabs-container">
        <label for="sub-tab5-1">Start/End</label>
        <label for="sub-tab5-2">Play/Pause</label>
        <!-- <label class= "zzzTest" for="animate-speed-slider">Speed</label> -->
        <input class="slider" id="animate-speed-slider" type="range" min="100" max="8000" value="4000">
    </div>
    <input class="tab-radio" id="sub-tab5-1" name="sub-group5" type="checkbox">
    <input class="tab-radio" id="sub-tab5-2" name="sub-group5" type="checkbox">
</div>

{/if}
{#if selectedTab == 'Select'}
<input class="tab-radio" id="main-tab-6" name="main-group" type="radio">
<div class="tab-content loop-sketch">
    <div class="sub-tabs-container">
        <label for="sub-tab6-1" title="Reset selectors">Reset</label>
        <label for="sub-tab6-2" title="Hover to highlight circular regions of data (2D only)">Circle</label>
        <label for="sub-tab6-3" title="Hover to highlight rectangular slices of data (2D only)">Slice</label>
        <label for="sub-tab6-4" title="Highlight only movement">Movement</label>
        <label for="sub-tab6-5" title="Highlight only stops">Stops</label>
        <label for="sub-tab6-6" title="Drag to select rectangular regions of data in 2D View. Hold option key to select multiple regions.">Highlight</label>
    </div>
    <input class="tab-radio" id="sub-tab6-1" name="sub-group6" type="radio">
    <input class="tab-radio" id="sub-tab6-2" name="sub-group6" type="radio">
    <input class="tab-radio" id="sub-tab6-3" name="sub-group6" type="radio">
    <input class="tab-radio" id="sub-tab6-4" name="sub-group6" type="radio">
    <input class="tab-radio" id="sub-tab6-5" name="sub-group6" type="radio">
    <input class="tab-radio" id="sub-tab6-6" name="sub-group6" type="radio">
</div>
{/if}
{#if selectedTab == 'Floor Plan'}
<input class="tab-radio" id="main-tab-7" name="main-group" type="radio">
<div class="tab-content loop-sketch">
    <div class="sub-tabs-container">
        <label for="sub-tab7-1">Rotate Left</label>
        <label for="sub-tab7-2">Rotate Right</label>
    </div>
    <input class="tab-radio" id="sub-tab7-1" name="sub-group7" type="checkbox">
    <input class="tab-radio" id="sub-tab7-2" name="sub-group7" type="checkbox">
</div>
{/if}
{#if selectedTab == 'Codes'}
<input class="tab-radio" id="main-tab-8" name="main-group" type="radio">
<div class="tab-content loop-sketch" id="codes-main-tab">
    <div class="sub-tabs-container button-float">
        <label for="sub-tab8-1" title="Color data by codes files (grey = no code and black = multiple codes)">Color
            By Codes</label>
        <label for="sub-tab8-2" style="display: none" title="Click to change and set colors">Change
            Color</label>
    </div>
    <input class="tab-radio" id="sub-tab8-1" name="sub-group8" type="checkbox">
    <input class="tab-radio js-color-change" id="sub-tab8-2" name="sub-group8" type="checkbox">
</div>
{/if}
{#if selectedTab == 'Export'}
<input class="tab-radio" id="main-tab-9" name="main-group" type="radio">
<div class="tab-content loop-sketch">
    <div class="sub-tabs-container">
        <label for="sub-tab9-1" title="Click to create code files from selected/displayed data">Code File</label>
    </div>
    <input class="tab-radio" id="sub-tab9-1" name="sub-group8" type="checkbox">
</div>
{/if}