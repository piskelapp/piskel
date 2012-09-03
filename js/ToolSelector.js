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
		"rectangle" : new pskl.drawingtools.Rectangle()
	};
	var currentSelectedTool = toolInstances.simplePen;
	var previousSelectedTool = toolInstances.simplePen;

	var selectTool_ = function(tool) {
		var maincontainer = $("body");
        var previousSelectedToolClass = maincontainer.data("selected-tool-class");
        if(previousSelectedToolClass) {
          maincontainer.removeClass(previousSelectedToolClass);
        }
        maincontainer.addClass(toolBehavior.toolId);
        $("#drawing-canvas-container").data("selected-tool-class", toolBehavior.toolId);
	};

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
				if (toolInstances[tool].toolId == clickedTool.data()["toolId"]) {
					selectTool_(toolInstances[tool]);

					// Show tool as selected:
					$("#tools-container .tool-icon.selected").removeClass("selected");
					clickedTool.addClass("selected");
				}
			}
		}
	};

	return {
		init: function() {
			
			// Initialize tool:
			// Set SimplePen as default selected tool:
			selectTool_(toolInstances.simplePen);
			// Activate listener on tool panel:
			$("#tools-container").click(onToolIconClicked_);

			// Special right click handlers (select the eraser tool)
			$.subscribe(Events.CANVAS_RIGHT_CLICKED, function() {
				previousSelectedTool = currentSelectedTool;
				currentSelectedTool = toolInstances.eraser;
				$.publish(Events.TOOL_SELECTED, [currentSelectedTool]);
			});

			$.subscribe(Events.CANVAS_RIGHT_CLICK_RELEASED, function() {
				currentSelectedTool = previousSelectedTool;
				$.publish(Events.TOOL_SELECTED, [currentSelectedTool]);
			});
		}
	};
})();



