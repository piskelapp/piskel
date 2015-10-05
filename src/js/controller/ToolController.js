(function () {
  var ns = $.namespace('pskl.controller');

  ns.ToolController = function () {
    var toDescriptor = function (id, shortcut, instance) {
      return {id:id, shortcut:shortcut, instance:instance};
    };

    this.tools = [
      toDescriptor('simplePen', 'P', new pskl.tools.drawing.SimplePen()),
      toDescriptor('verticalMirrorPen', 'V', new pskl.tools.drawing.VerticalMirrorPen()),
      toDescriptor('paintBucket', 'B', new pskl.tools.drawing.PaintBucket()),
      toDescriptor('colorSwap', 'A', new pskl.tools.drawing.ColorSwap()),
      toDescriptor('eraser', 'E', new pskl.tools.drawing.Eraser()),
      toDescriptor('stroke', 'L', new pskl.tools.drawing.Stroke()),
      toDescriptor('rectangle', 'R', new pskl.tools.drawing.Rectangle()),
      toDescriptor('circle', 'C', new pskl.tools.drawing.Circle()),
      toDescriptor('move', 'M', new pskl.tools.drawing.Move()),
      toDescriptor('shapeSelect', 'Z', new pskl.tools.drawing.selection.ShapeSelect()),
      toDescriptor('rectangleSelect', 'S', new pskl.tools.drawing.selection.RectangleSelect()),
      toDescriptor('lassoSelect', 'H', new pskl.tools.drawing.selection.LassoSelect()),
      toDescriptor('lighten', 'U', new pskl.tools.drawing.Lighten()),
      toDescriptor('dithering', 'T', new pskl.tools.drawing.DitheringTool()),
      toDescriptor('colorPicker', 'O', new pskl.tools.drawing.ColorPicker())
    ];

    this.toolIconRenderer = new pskl.tools.IconMarkupRenderer();
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
    $('#tool-section').mousedown($.proxy(this.onToolIconClicked_, this));

    $.subscribe(Events.SELECT_TOOL, this.onSelectToolEvent_.bind(this));
  };

  /**
   * @private
   */
  ns.ToolController.prototype.activateToolOnStage_ = function(tool) {
    var stage = $('body');
    var previousSelectedToolClass = stage.data('selected-tool-class');
    if (previousSelectedToolClass) {
      stage.removeClass(previousSelectedToolClass);
      stage.removeClass(pskl.tools.drawing.Move.TOOL_ID);
    }
    stage.addClass(tool.instance.toolId);
    stage.data('selected-tool-class', tool.instance.toolId);
  };

  ns.ToolController.prototype.onSelectToolEvent_ = function(event, toolId) {
    var tool = this.getToolById_(toolId);
    if (tool) {
      this.selectTool_(tool);
    }
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
    var clickedTool = target.closest('.tool-icon');

    if (clickedTool.length) {
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
    return pskl.utils.Array.find(this.tools, function (tool) {
      return tool.instance.toolId == toolId;
    });
  };

  /**
   * @private
   */
  ns.ToolController.prototype.createToolsDom_ = function() {
    var html = '';
    for (var i = 0 ; i < this.tools.length ; i++) {
      var tool = this.tools[i];
      html += this.toolIconRenderer.render(tool.instance, tool.shortcut);
    }
    $('#tools-container').html(html);
  };

  ns.ToolController.prototype.addKeyboardShortcuts_ = function () {
    for (var i = 0 ; i < this.tools.length ; i++) {
      pskl.app.shortcutService.addShortcut(this.tools[i].shortcut, this.onKeyboardShortcut_.bind(this));
    }
  };
})();
