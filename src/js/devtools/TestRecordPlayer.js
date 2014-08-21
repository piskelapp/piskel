(function () {
  var ns = $.namespace('pskl.devtools');

  ns.TestRecordPlayer = function (testRecord) {
    this.initialState = testRecord.initialState;
    this.events = testRecord.events;
    this.referencePng = testRecord.png;
    this.shim = null;
  };

  ns.TestRecordPlayer.STEP = 40;

  ns.TestRecordPlayer.prototype.start = function () {
    this.setupInitialState_();
    this.createMouseShim_();
    this.playEvent_(0);
  };

  ns.TestRecordPlayer.prototype.setupInitialState_ = function () {
    var size = this.initialState.size;
    var piskel = this.createPiskel_(size.width, size.height);
    pskl.app.piskelController.setPiskel(piskel, true);

    $.publish(Events.SELECT_PRIMARY_COLOR, [this.initialState.primaryColor]);
    $.publish(Events.SELECT_SECONDARY_COLOR, [this.initialState.secondaryColor]);
    $.publish(Events.SELECT_TOOL, [this.initialState.selectedTool]);
  };

  ns.TestRecordPlayer.prototype.createMouseShim_ = function () {
    this.shim = document.createElement('DIV');
    this.shim.style.cssText = 'position:fixed;top:0;left:0;right:0;left:0;bottom:0;z-index:15000';
    this.shim.addEventListener('mousemove', function (e) {
      e.stopPropagation();
      e.preventDefault();
    });
    document.body.appendChild(this.shim);
  };

  ns.TestRecordPlayer.prototype.createPiskel_ = function (width, height) {
    var descriptor = new pskl.model.piskel.Descriptor('TestPiskel', '');
    var piskel = new pskl.model.Piskel(width, height, descriptor);
    var layer = new pskl.model.Layer("Layer 1");
    var frame = new pskl.model.Frame(width, height);

    layer.addFrame(frame);
    piskel.addLayer(layer);

    return piskel;
  };

  ns.TestRecordPlayer.prototype.playEvent_ = function (index) {
    this.timer = window.setTimeout(function () {
      var recordEvent = this.events[index];

      if (recordEvent.type === 'mouse-event') {
        this.playMouseEvent_(recordEvent);
      } else if (recordEvent.type === 'color-event') {
        this.playColorEvent_(recordEvent);
      } else if (recordEvent.type === 'tool-event') {
        this.playToolEvent_(recordEvent);
      } else if (recordEvent.type === 'instrumented-event') {
        this.playInstrumentedEvent_(recordEvent);
      }

      if (this.events[index+1]) {
        this.playEvent_(index+1);
      } else {
        this.onTestEnd_();
      }
    }.bind(this), ns.TestRecordPlayer.STEP);
  };

  ns.TestRecordPlayer.prototype.onTestEnd_ = function () {
    var renderer = new pskl.rendering.PiskelRenderer(pskl.app.piskelController);
    var png = renderer.renderAsCanvas().toDataURL();

    var image = new Image();
    image.onload = function () {
      var canvas = pskl.CanvasUtils.createFromImage(image);
      var referencePng = canvas.toDataURL();
      var success = png === referencePng;

      this.shim.parentNode.removeChild(this.shim);
      this.shim = null;

      $.publish(Events.TEST_RECORD_END, [success, png + '  vs  ' + referencePng]);
    }.bind(this);
    image.src = this.referencePng;

  };

  ns.TestRecordPlayer.prototype.playMouseEvent_ = function (recordEvent) {
    var event = recordEvent.event;
    var screenCoordinates = pskl.app.drawingController.getScreenCoordinates(recordEvent.coords.x, recordEvent.coords.y);
    event.clientX = screenCoordinates.x;
    event.clientY = screenCoordinates.y;
    if (event.type == 'mousedown') {
      pskl.app.drawingController.onMousedown_(event);
    } else if (event.type == 'mouseup') {
      pskl.app.drawingController.onMouseup_(event);
    } else if (event.type == 'mousemove') {
      pskl.app.drawingController.onMousemove_(event);
    }
  };

  ns.TestRecordPlayer.prototype.playColorEvent_ = function (recordEvent) {
    if (recordEvent.isPrimary) {
      $.publish(Events.SELECT_PRIMARY_COLOR, [recordEvent.color]);
    } else {
      $.publish(Events.SELECT_SECONDARY_COLOR, [recordEvent.color]);
    }
  };

  ns.TestRecordPlayer.prototype.playToolEvent_ = function (recordEvent) {
    $.publish(Events.SELECT_TOOL, [recordEvent.toolId]);
  };

  ns.TestRecordPlayer.prototype.playInstrumentedEvent_ = function (recordEvent) {
    pskl.app.piskelController[recordEvent.methodName].apply(pskl.app.piskelController, recordEvent.args);
  };


})();