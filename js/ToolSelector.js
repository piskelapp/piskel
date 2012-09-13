/*
 * @provide pskl.ToolSelector
 *
 * @require Constants
 * @require Events
 * @require pskl.drawingtools
 */
$.namespace("pskl");

pskl.ToolSelector = (function() {
	
    var toolInstances = {
        "simplePen" : new pskl.drawingtools.SimplePen(),
        "eraser" : new pskl.drawingtools.Eraser(),
        "paintBucket" : new pskl.drawingtools.PaintBucket(),
        "stroke" : new pskl.drawingtools.Stroke(),
        "rectangle" : new pskl.drawingtools.Rectangle(),
        "move" : new pskl.drawingtools.Move(),
        "select" : new pskl.drawingtools.Select()
    };
    var currentSelectedTool = toolInstances.simplePen;
    var previousSelectedTool = toolInstances.simplePen;

    var activateToolOnStage_ = function(tool) {
        var stage = $("body");
        var previousSelectedToolClass = stage.data("selected-tool-class");
        if(previousSelectedToolClass) {
          stage.removeClass(previousSelectedToolClass);
        }
        stage.addClass(tool.toolId);
        stage.data("selected-tool-class", tool.toolId);
    };

    var selectTool_ = function(tool) {
        console.log("Selecting Tool:" , currentSelectedTool);
        currentSelectedTool = tool;
        activateToolOnStage_(currentSelectedTool);
        $.publish(Events.TOOL_SELECTED, [tool]);
    };

    /**
     * @private
     */
    var onToolIconClicked_ = function(evt) {
        var target = $(evt.target);
        var clickedTool = target.closest(".tool-icon");

        if(clickedTool.length) {
            for(var tool in toolInstances) {
                if (toolInstances[tool].toolId == clickedTool.data().toolId) {
                    selectTool_(toolInstances[tool]);

                    // Show tool as selected:
                    $("#tools-container .tool-icon.selected").removeClass("selected");
                    clickedTool.addClass("selected");
                }
            }
        }
    };

    /**
     * Get state for the checkbox that control the display of the grid
     * on the drawing canvas.
     * @private
     */
    var isShowGridChecked_ = function() {
        var showGridCheckbox = $('#show-grid');
        var isChecked = showGridCheckbox.is(':checked');
        return isChecked;
    };

    return {
        init: function() {
            
            // Initialize tool:
            // Set SimplePen as default selected tool:
            selectTool_(toolInstances.simplePen);
            // Activate listener on tool panel:
            $("#tools-container").click(onToolIconClicked_);

            // Show/hide the grid on drawing canvas:
            $.publish(Events.GRID_DISPLAY_STATE_CHANGED, [isShowGridChecked_()]);
            $('#show-grid').change(function(evt) {
                var checked = isShowGridChecked_();
                $.publish(Events.GRID_DISPLAY_STATE_CHANGED, [checked]);
            });
        }
    };
})();



