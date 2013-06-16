(function () {
    var ns = $.namespace("pskl.controller");

    
    ns.ToolController = function () {
	
        this.toolInstances = {
            "simplePen" : new pskl.drawingtools.SimplePen(),
            "verticalMirrorPen" : new pskl.drawingtools.VerticalMirrorPen(),
            "eraser" : new pskl.drawingtools.Eraser(),
            "paintBucket" : new pskl.drawingtools.PaintBucket(),
            "stroke" : new pskl.drawingtools.Stroke(),
            "rectangle" : new pskl.drawingtools.Rectangle(),
            "circle" : new pskl.drawingtools.Circle(),
            "move" : new pskl.drawingtools.Move(),
            "rectangleSelect" : new pskl.drawingtools.RectangleSelect(),
            "shapeSelect" : new pskl.drawingtools.ShapeSelect(),
            "colorPicker" : new pskl.drawingtools.ColorPicker()
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
                    $('#tool-section .tool-icon.selected').removeClass('selected');
                    clickedTool.addClass('selected');
                }
            }
        }
    };

    /**
     * @private
     */
    ns.ToolController.prototype.createToolMarkup_ = function() {
        var currentTool, toolMarkup = '', extraClass;
        // TODO(vincz): Tools rendering order is not enforced by the data stucture (this.toolInstances), fix that.
        for (var toolKey in this.toolInstances) {
            currentTool = this.toolInstances[toolKey];
            extraClass = currentTool.toolId;
            if (this.currentSelectedTool == currentTool) {
                extraClass = extraClass + " selected";
            }
            toolMarkup += '<li rel="tooltip" data-placement="right" class="tool-icon ' + extraClass + '" data-tool-id="' + currentTool.toolId +
                            '" title="' + currentTool.helpText + '"></li>';
        }
        $('#tools-container').html(toolMarkup);
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
        $("#tool-section").click($.proxy(this.onToolIconClicked_, this));
    };
})();