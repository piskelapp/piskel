/*
 * @provide pskl.ToolSelector
 *
 * @require Constants
 * @require Events
 * @require pskl.drawingtools
 */
$.namespace("pskl");

pskl.ToolSelector = (function() {
	
	var paletteColors = [];
      
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

	/**
	 * @private
	 */
	 var onPickerChange_ = function(evt) {
        var inputPicker = $(evt.target);
        $.publish(Events.COLOR_SELECTED, [inputPicker.val()]);
	 };

	 /**
	  * @private
	  */
	 var addColorToPalette_ = function (color) {
      if (paletteColors.indexOf(color) == -1) {
      	var paletteEl = $("#palette");
        var colorEl = document.createElement("li");    
        colorEl.className = "palette-color";
        colorEl.setAttribute("data-color", color);
        colorEl.setAttribute("title", color);
        colorEl.style.background = color;
        paletteEl[0].appendChild(colorEl);
        paletteColors.push(color);
      }
    },

    /**
     * @private
     */
    onPaletteColorClick_ = function (event) {
      var selectedColor = $(event.target).data("color");
      var colorPicker = $('#color-picker');
      if (selectedColor == Constants.TRANSPARENT_COLOR) {
        // We can set the current palette color to transparent.
        // You can then combine this transparent color with an advanced
        // tool for customized deletions. 
        // Eg: bucket + transparent: Delete a colored area
        //     Stroke + transparent: hollow out the equivalent of a stroke

        // The colorpicker can't be set to a transparent state.
        // We set its background to white and insert the
        // string "TRANSPARENT" to mimic this state:
        colorPicker[0].color.fromString("#fff");
        colorPicker.val("TRANSPARENT");
      } else {
        colorPicker[0].color.fromString(selectedColor);
      }
      $.publish(Events.COLOR_SELECTED, [selectedColor])
    };

	return {
		init: function() {
			
			// Initialize tool:
			// Set SimplePen as default selected tool:
			selectTool_(toolInstances.simplePen);
			// Activate listener on tool panel:
			$("#tools-container").click(onToolIconClicked_);

			// Initialize colorpicker:
			var colorPicker = $('#color-picker');
      		colorPicker.val(Constants.DEFAULT_PEN_COLOR);
      		colorPicker.change(onPickerChange_);

      		// Initialize palette:
      		$("#palette").click(onPaletteColorClick_);
      		$.subscribe(Events.COLOR_USED, function(evt, color) {
      			addColorToPalette_(color);
      		});

			
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



