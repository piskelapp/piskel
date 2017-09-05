(function () {
  var ns = $.namespace('pskl.devtools');

  ns.DrawingTestRecorder = function (piskelController) {
    this.piskelController = piskelController;
    this.isRecording = false;
    this.reset();
  };

  ns.DrawingTestRecorder.prototype.init = function () {
    $.subscribe(Events.MOUSE_EVENT, this.onMouseEvent_.bind(this));
    $.subscribe(Events.KEYBOARD_EVENT, this.onKeyboardEvent_.bind(this));
    $.subscribe(Events.TOOL_SELECTED, this.onToolEvent_.bind(this));
    $.subscribe(Events.PEN_SIZE_CHANGED, this.onPenSizeChanged_.bind(this));
    $.subscribe(Events.TRANSFORMATION_EVENT, this.onTransformationEvent_.bind(this));
    $.subscribe(Events.PRIMARY_COLOR_SELECTED, this.onColorEvent_.bind(this, true));
    $.subscribe(Events.SECONDARY_COLOR_SELECTED, this.onColorEvent_.bind(this, false));
    $.subscribe(Events.CLIPBOARD_COPY, this.onClipboardEvent_.bind(this));
    $.subscribe(Events.CLIPBOARD_CUT, this.onClipboardEvent_.bind(this));
    $.subscribe(Events.CLIPBOARD_PASTE, this.onClipboardEvent_.bind(this));


    for (var key in this.piskelController) {
      if (typeof this.piskelController[key] == 'function') {
        var methodTriggersReset = this.piskelController[key].toString().indexOf('Events.PISKEL_RESET') != -1;
        if (methodTriggersReset) {
          this.piskelController[key] = this.instrumentMethod_(this.piskelController, key);
        }
      }
    }
  };

  ns.DrawingTestRecorder.prototype.instrumentMethod_ = function (object, methodName) {
    var method = object[methodName];
    var testRecorder = this;
    return function () {
      testRecorder.onInstrumentedMethod_(object, methodName, arguments);
      return method.apply(this, arguments);
    };
  };

  ns.DrawingTestRecorder.prototype.reset = function () {
    this.initialState = {};
    this.events = [];
  };

  ns.DrawingTestRecorder.prototype.startRecord = function () {
    this.isRecording = true;
    this.initialState = {
      size : {
        width : this.piskelController.getWidth(),
        height : this.piskelController.getHeight()
      },
      primaryColor : pskl.app.selectedColorsService.getPrimaryColor(),
      secondaryColor : pskl.app.selectedColorsService.getSecondaryColor(),
      selectedTool : pskl.app.toolController.currentSelectedTool.toolId,
      penSize : pskl.app.penSizeService.getPenSize()
    };
  };

  ns.DrawingTestRecorder.prototype.stopRecord = function () {
    this.isRecording = false;

    var renderer = new pskl.rendering.PiskelRenderer(this.piskelController);
    var png = renderer.renderAsCanvas().toDataURL();

    var testRecord = JSON.stringify({
      events : this.events,
      initialState : this.initialState,
      png : png
    }, null, ' ');

    this.reset();

    return testRecord;
  };

  ns.DrawingTestRecorder.prototype.onMouseEvent_ = function (evt, mouseEvent, originator) {
    if (this.isRecording) {
      this.recordMouseEvent_(mouseEvent);
    }
  };

  ns.DrawingTestRecorder.prototype.onKeyboardEvent_ = function (evt, domEvent) {
    if (this.isRecording) {
      var recordEvent = {};
      recordEvent.type = 'keyboard-event';
      recordEvent.event = {
        which : domEvent.which,
        shiftKey : domEvent.shiftKey,
        altKey : domEvent.altKey,
        ctrlKey : domEvent.ctrlKey || domEvent.metaKey,
        target : {
          nodeName : domEvent.target.nodeName
        }
      };
      this.events.push(recordEvent);
    }
  };

  ns.DrawingTestRecorder.prototype.onColorEvent_ = function (isPrimary, evt, color) {
    if (this.isRecording) {
      var recordEvent = {};
      recordEvent.type = 'color-event';
      recordEvent.color = color;
      recordEvent.isPrimary = isPrimary;
      this.events.push(recordEvent);
    }
  };

  ns.DrawingTestRecorder.prototype.onToolEvent_ = function (evt, tool) {
    if (this.isRecording) {
      var recordEvent = {};
      recordEvent.type = 'tool-event';
      recordEvent.toolId = tool.toolId;
      this.events.push(recordEvent);
    }
  };

  ns.DrawingTestRecorder.prototype.onPenSizeChanged_ = function (evt) {
    if (this.isRecording) {
      var recordEvent = {};
      recordEvent.type = 'pensize-event';
      recordEvent.penSize = pskl.app.penSizeService.getPenSize();
      this.events.push(recordEvent);
    }
  };

  ns.DrawingTestRecorder.prototype.onTransformationEvent_ = function (evt, toolId, domEvent) {
    if (this.isRecording) {
      var recordEvent = {};
      recordEvent.type = 'transformtool-event';
      recordEvent.toolId = toolId;
      recordEvent.event = {
        shiftKey : domEvent.shiftKey,
        altKey : domEvent.altKey,
        ctrlKey : domEvent.ctrlKey
      };
      this.events.push(recordEvent);
    }
  };

  ns.DrawingTestRecorder.prototype.onClipboardEvent_ = function (evt) {
    if (this.isRecording) {
      var recordEvent = {};
      recordEvent.type = 'clipboard-event';
      recordEvent.event = evt;
      this.events.push(recordEvent);
    }
  };

  ns.DrawingTestRecorder.prototype.onInstrumentedMethod_ = function (callee, methodName, args) {
    if (this.isRecording) {
      var recordEvent = {};
      recordEvent.type = 'instrumented-event';
      recordEvent.methodName = methodName;
      recordEvent.args = Array.prototype.slice.call(args, 0);

      if (methodName === 'setPiskel' && args[1].noSnapshot) {
        // Skip recording calls to setPiskel that don't trigger a save.
        return;
      }

      this.events.push(recordEvent);
    }
  };

  ns.DrawingTestRecorder.prototype.recordMouseEvent_ = function (mouseEvent) {
    var coords = pskl.app.drawingController.getSpriteCoordinates(mouseEvent.clientX, mouseEvent.clientY);
    var recordEvent = new ns.MouseEvent(mouseEvent, coords);
    var lastEvent = this.events[this.events.length - 1];

    if (!recordEvent.equals(lastEvent)) {
      this.events.push(recordEvent);
    }
  };

})();
