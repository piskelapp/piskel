(function () {
  var ns = $.namespace("pskl.controller");

  ns.ToolController = function () {
    var toDescriptor = function (id, shortcut, instance) {
      return {id:id, shortcut:shortcut, instance:instance};
    };

    this.tools = [
      toDescriptor('simplePen', 'P', new pskl.drawingtools.SimplePen()),
      toDescriptor('verticalMirrorPen', 'V', new pskl.drawingtools.VerticalMirrorPen()),
      toDescriptor('paintBucket', 'B', new pskl.drawingtools.PaintBucket()),
      toDescriptor('colorSwap', 'F', new pskl.drawingtools.ColorSwap()),
      toDescriptor('eraser', 'E', new pskl.drawingtools.Eraser()),
      toDescriptor('stroke', 'L', new pskl.drawingtools.Stroke()),
      toDescriptor('rectangle', 'R', new pskl.drawingtools.Rectangle()),
      toDescriptor('circle', 'C', new pskl.drawingtools.Circle()),
      toDescriptor('move', 'M', new pskl.drawingtools.Move()),
      toDescriptor('rectangleSelect', 'S', new pskl.drawingtools.RectangleSelect()),
      toDescriptor('shapeSelect', 'Z', new pskl.drawingtools.ShapeSelect()),
      toDescriptor('lighten', 'U', new pskl.drawingtools.Lighten()),
      toDescriptor('colorPicker', 'O', new pskl.drawingtools.ColorPicker())
    ];

    this.currentSelectedTool = this.tools[0];
    this.previousSelectedTool = this.tools[0];
  };

  /**
   * @public
   */
  ns.ToolController.prototype.init = function() {
    this.createToolsDom_();
    this.addKeyboardShortcuts_();

    // Initialize tool:
    // Set SimplePen as default selected tool:
    this.selectTool_(this.tools[0]);
    // Activate listener on tool panel:
    $("#tool-section").mousedown($.proxy(this.onToolIconClicked_, this));
  };

  /**
   * @private
   */
  ns.ToolController.prototype.activateToolOnStage_ = function(tool) {
    var stage = $("body");
    var previousSelectedToolClass = stage.data("selected-tool-class");
    if(previousSelectedToolClass) {
      stage.removeClass(previousSelectedToolClass);
      stage.removeClass(pskl.drawingtools.Move.TOOL_ID);
    }
    stage.addClass(tool.instance.toolId);
    stage.data("selected-tool-class", tool.instance.toolId);
  };

  /**
   * @private
   */
  ns.ToolController.prototype.selectTool_ = function(tool) {
    this.currentSelectedTool = tool;
    this.activateToolOnStage_(this.currentSelectedTool);

    var selectedToolElement = $('#tool-section .tool-icon.selected');
    var toolElement = $('[data-tool-id=' + tool.instance.toolId + ']');

    selectedToolElement.removeClass('selected');
    toolElement.addClass('selected');

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
      }
    }
  };

  ns.ToolController.prototype.onKeyboardShortcut_ = function(charkey) {
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
  ns.ToolController.prototype.createToolsDom_ = function() {
    var toolMarkup = '';
    for(var i = 0 ; i < this.tools.length ; i++) {
      toolMarkup += this.getToolMarkup_(this.tools[i]);
    }
    $('#tools-container').html(toolMarkup);
  };

  /**
   * @private
   */
  ns.ToolController.prototype.getToolMarkup_ = function(tool) {
    var toolId = tool.instance.toolId;

    var classList = ['tool-icon', toolId];
    if (this.currentSelectedTool == tool) {
      classList.push('selected');
    }

    var tpl = pskl.utils.Template.get('drawing-tool-item-template');
    return pskl.utils.Template.replace(tpl, {
      cssclass : classList.join(' '),
      toolid : toolId,
      title : this.getTooltipText_(tool)
    });
  };

  ns.ToolController.prototype.getTooltipText_ = function (tool) {
    return tool.instance.helpText + ' (' + tool.shortcut + ')';
  };

  ns.ToolController.prototype.addKeyboardShortcuts_ = function () {
    for(var i = 0 ; i < this.tools.length ; i++) {
      pskl.app.shortcutService.addShortcut(this.tools[i].shortcut, this.onKeyboardShortcut_.bind(this));
    }
  };
})();