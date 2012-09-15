(function () {
    var ns = $.namespace("pskl.controller");

    
    ns.ToolController = function () {
	
        this.toolInstances = {
            "simplePen" : new pskl.drawingtools.SimplePen(),
            "mirrorPen" : new pskl.drawingtools.MirrorPen(),
            "eraser" : new pskl.drawingtools.Eraser(),
            "paintBucket" : new pskl.drawingtools.PaintBucket(),
            "stroke" : new pskl.drawingtools.Stroke(),
            "rectangle" : new pskl.drawingtools.Rectangle(),
            "circle" : new pskl.drawingtools.Circle(),
            "move" : new pskl.drawingtools.Move(),
            "rectangleSelect" : new pskl.drawingtools.RectangleSelect(),
            "shapeSelect" : new pskl.drawingtools.ShapeSelect()
        };

        this.currentSelectedTool = this.toolInstances.simplePen;
        this.previousSelectedTool = this.toolInstances.simplePen;
    };

    /**
     * @private
     */
    ns.ToolController.prototype.activateToolOnStage_ = function(tool) {
        var stage = $("body");
        var previousSelectedToolClass = stage.data("selected-tool-class");
        if(previousSelectedToolClass) {
          stage.removeClass(previousSelectedToolClass);
        }
        stage.addClass(tool.toolId);
        stage.data("selected-tool-class", tool.toolId);
    };

    /**
     * @private
     */
    ns.ToolController.prototype.selectTool_ = function(tool) {
        console.log("Selecting Tool:" , this.currentSelectedTool);
        this.currentSelectedTool = tool;
        this.activateToolOnStage_(this.currentSelectedTool);
        $.publish(Events.TOOL_SELECTED, [tool]);
    };

    /**
     * @private
     */
    ns.ToolController.prototype.onToolIconClicked_ = function(evt) {
        var target = $(evt.target);
        var clickedTool = target.closest(".tool-icon");

        if(clickedTool.length) {
            for(var tool in this.toolInstances) {
                if (this.toolInstances[tool].toolId == clickedTool.data().toolId) {
                    this.selectTool_(this.toolInstances[tool]);

                    // Show tool as selected:
                    $('#menubar .tool-icon.selected').removeClass('selected');
                    clickedTool.addClass('selected');
                }
            }
        }
    };

    /**
     * @private
     */
    ns.ToolController.prototype.createToolMarkup_ = function() {
        var currentTool, toolMarkup = '';
        // TODO(vincz): Tools rendering order is not enforced by the data stucture (this.toolInstances), fix that.
        for (var toolKey in this.toolInstances) {
            currentTool = this.toolInstances[toolKey];
            toolMarkup += '<li class="tool-icon ' + currentTool.toolId + '" data-tool-id="' + currentTool.toolId +
                            '" title="' + currentTool.helpText + '"></li>';
        }
        $('#tools-container').html(toolMarkup);
    };

    /**
     * Get state for the checkbox that control the display of the grid
     * on the drawing canvas.
     * @private
     */
    ns.ToolController.prototype.isShowGridChecked_ = function() {
        var showGridCheckbox = $('#show-grid');
        var isChecked = showGridCheckbox.is(':checked');
        return isChecked;
    };

    /**
     * @public
     */
    ns.ToolController.prototype.init = function() {

        this.createToolMarkup_();

        // Initialize tool:
        // Set SimplePen as default selected tool:
        this.selectTool_(this.toolInstances.simplePen);
        // Activate listener on tool panel:
        $("#menubar").click($.proxy(this.onToolIconClicked_, this));

        // Show/hide the grid on drawing canvas:
        $.publish(Events.GRID_DISPLAY_STATE_CHANGED, [this.isShowGridChecked_()]);
        $('#show-grid').change($.proxy(function(evt) {
            var checked = this.isShowGridChecked_();
            $.publish(Events.GRID_DISPLAY_STATE_CHANGED, [checked]);
        }, this));
    };
})();