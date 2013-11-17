(function () {
  var ns = $.namespace("pskl.controller");


  ns.ToolController = function () {
    var toDescriptor = function (id, shortcut, instance) {
      return {id:id, shortcut:shortcut, instance:instance};
    };

    this.tools = [
      toDescriptor('simplePen', 'P', new pskl.drawingtools.SimplePen()),
      toDescriptor('verticalMirrorPen', 'V', new pskl.drawingtools.VerticalMirrorPen()),
      toDescriptor('eraser', 'E', new pskl.drawingtools.Eraser()),
      toDescriptor('paintBucket', 'B', new pskl.drawingtools.PaintBucket()),
      toDescriptor('stroke', 'L', new pskl.drawingtools.Stroke()),
      toDescriptor('rectangle', 'R', new pskl.drawingtools.Rectangle()),
      toDescriptor('circle', 'C', new pskl.drawingtools.Circle()),
      toDescriptor('move', 'M', new pskl.drawingtools.Move()),
      toDescriptor('rectangleSelect', 'S', new pskl.drawingtools.RectangleSelect()),
      toDescriptor('shapeSelect', 'Z', new pskl.drawingtools.ShapeSelect()),
      toDescriptor('colorPicker', 'O', new pskl.drawingtools.ColorPicker())
    ];

    this.currentSelectedTool = this.tools[0];
    this.previousSelectedTool = this.tools[0];
  };

  /**
   * @public
   */
  ns.ToolController.prototype.init = function() {
    this.createToolMarkup_();

    // Initialize tool:
    // Set SimplePen as default selected tool:
    this.selectTool_(this.tools[0]);
    // Activate listener on tool panel:
    $("#tool-section").click($.proxy(this.onToolIconClicked_, this));

    $.subscribe(Events.SELECT_TOOL, $.proxy(this.onKeyboardShortcut_, this));
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
    stage.addClass(tool.instance.toolId);
    stage.data("selected-tool-class", tool.instance.toolId);
  };

  /**
   * @private
   */
  ns.ToolController.prototype.selectTool_ = function(tool) {
    console.log("Selecting Tool:" , this.currentSelectedTool.name);
    this.currentSelectedTool = tool;
    this.activateToolOnStage_(this.currentSelectedTool);
    $.publish(Events.TOOL_SELECTED, [tool.instance]);
  };

  /**
   * @private
   */
  ns.ToolController.prototype.onToolIconClicked_ = function(evt) {
    var target = $(evt.target);
    var clickedTool = target.closest(".tool-icon");

    if(clickedTool.length) {
      var toolId = clickedTool.data().toolId;
      var tool = this.getToolById_(toolId);
      if (tool) {
        this.selectTool_(tool);

        // Show tool as selected:
        $('#tool-section .tool-icon.selected').removeClass('selected');
        clickedTool.addClass('selected');
      }
    }
  };

  ns.ToolController.prototype.onKeyboardShortcut_ = function(evt, charkey) {
    for (var i = 0 ; i < this.tools.length ; i++) {
      var tool = this.tools[i];
      if (tool.shortcut.toLowerCase() === charkey.toLowerCase()) {
        this.selectTool_(tool);
      }
    }
  };

  ns.ToolController.prototype.getToolById_ = function (toolId) {
    for(var i = 0 ; i < this.tools.length ; i++) {
      var tool = this.tools[i];
      if (tool.instance.toolId == toolId) {
        return tool;
      }
    }
    return null;
  };

  /**
   * @private
   */
  ns.ToolController.prototype.createToolMarkup_ = function() {
    var currentTool, toolMarkup = '', extraClass;
    // TODO(vincz): Tools rendering order is not enforced by the data stucture (this.toolInstances), fix that.
    for(var i = 0 ; i < this.tools.length ; i++) {
      var tool = this.tools[i];
      var instance = tool.instance;

      extraClass = instance.toolId;
      if (this.currentSelectedTool == tool) {
        extraClass = extraClass + " selected";
      }
      toolMarkup += '<li rel="tooltip" data-placement="right" class="tool-icon ' + extraClass + '" data-tool-id="' + instance.toolId +
              '" title="' + instance.helpText + '"></li>';
    }
    $('#tools-container').html(toolMarkup);
  };
})();