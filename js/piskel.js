/**
 * @require Constants
 * @require Events
 */
$.namespace("pskl");

(function () {

  /**
   * FrameSheetModel instance.
   */
  var frameSheet;
  /**
   * Main application controller
   */
  var piskel = {

    init : function () {
      var frameSize = this.readSizeFromURL_();
      frameSheet = new pskl.model.FrameSheet(frameSize.height, frameSize.width);

      frameSheet.addEmptyFrame();
      
      this.drawingController = new pskl.controller.DrawingController(frameSheet, $('#drawing-canvas-container'));
      this.animationController = new pskl.controller.AnimatedPreviewController(frameSheet, $('#preview-canvas-container'));
      this.previewsController = new pskl.controller.PreviewFilmController(frameSheet, $('#preview-list'));

      // To catch the current active frame, the selection manager have to be initialized before
      // the 'frameSheet.setCurrentFrameIndex(0);' line below.
      // TODO(vincz): Slice each constructor to have:
      //                  - an event(s) listening init
      //                  - an event(s) triggering init
      // All listeners will be hook in a first step, then all event triggering inits will be called
      // in a second batch.
      this.selectionManager = new pskl.selection.SelectionManager(frameSheet, this.drawingController.overlayFrame);

      // DO NOT MOVE THIS LINE (see comment above)
      frameSheet.setCurrentFrameIndex(0);

      this.animationController.init();
      this.previewsController.init();

      this.historyService = new pskl.service.HistoryService(frameSheet);
      this.historyService.init();

      this.keyboardEventService = new pskl.service.KeyboardEventService();
      this.keyboardEventService.init();

      this.notificationController = new pskl.controller.NotificationController();
      this.notificationController.init();

      this.localStorageService = new pskl.service.LocalStorageService(frameSheet);
      this.localStorageService.init();

      // TODO: Add comments 
      var framesheetId = this.readFramesheetIdFromURL_();
      if (framesheetId) {
        $.publish(Events.SHOW_NOTIFICATION, [{"content": "Loading animation with id : [" + framesheetId + "]"}]);
        this.loadFramesheetFromService(framesheetId);
      } else {
        this.finishInit();
        this.localStorageService.displayRestoreNotification();
      }

      var drawingLoop = new pskl.rendering.DrawingLoop();
      drawingLoop.addCallback(this.render, this);
      drawingLoop.start();

      // Init (event-delegated) bootstrap tooltips:
      $('body').tooltip({
        selector: '[rel=tooltip]'
      });
    },

    render : function (delta) {
      this.drawingController.render(delta);
      this.animationController.render(delta);
      this.previewsController.render(delta);
    },    

    finishInit : function () {
      var toolController = new pskl.controller.ToolController();
      toolController.init();
      
      var paletteController = new pskl.controller.PaletteController();
      paletteController.init(frameSheet);
    },

    readSizeFromURL_ : function () {
      var sizeParam = this.readUrlParameter_("size"), size;
      // parameter expected as size=64x48 => size=widthxheight
      var parts = sizeParam.split("x");
      if (parts && parts.length == 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        var width = parseInt(parts[0], 10),
            height = parseInt(parts[1], 10);
      
        size = {
          height : Math.min(height, Constants.MAX_HEIGHT),
          width : Math.min(width, Constants.MAX_WIDTH)
        };
      } else {
        size = Constants.DEFAULT_SIZE;
      }
      return size;
    },

    readFramesheetIdFromURL_ : function() {
      return this.readUrlParameter_("frameId");
    },

    readUrlParameter_ : function (paramName) {
      var searchString = window.location.search.substring(1),
      i, val, params = searchString.split("&");

      for (i=0;i<params.length;i++) {
        val = params[i].split("=");
        if (val[0] == paramName) {
          return unescape(val[1]);
        }
      }
      return "";
    },

    loadFramesheetFromService : function (frameId) {
      var xhr = new XMLHttpRequest();
      // TODO: Change frameId to framesheetId on the backend
      xhr.open('GET', Constants.PISKEL_SERVICE_URL + '/get?l=' + frameId, true);
      xhr.responseType = 'text';

      xhr.onload = function(e) {
        var res = JSON.parse(this.responseText);
        frameSheet.load(res.framesheet);
        piskel.animationController.setFPS(res.fps);
        $.publish(Events.HIDE_NOTIFICATION);
        piskel.finishInit();
      };

      xhr.onerror = function () {
        $.publish(Events.HIDE_NOTIFICATION);
        piskel.finishInit();
      };

      xhr.send();
    },

    // TODO(julz): Create package ?
    storeSheet : function (event) {
      // TODO Refactor using jquery ?
      var xhr = new XMLHttpRequest();
      var formData = new FormData();
      formData.append('framesheet_content', frameSheet.serialize());
      formData.append('fps_speed', $('#preview-fps').val());
      xhr.open('POST', Constants.PISKEL_SERVICE_URL + "/store", true);
      xhr.onload = function(e) {
        if (this.status == 200) {
          var baseUrl = window.location.href.replace(window.location.search, "");
          window.location.href = baseUrl + "?frameId=" + this.responseText;
        }
      };

      xhr.send(formData);

      if(event) {
        event.stopPropagation();
        event.preventDefault();
      }
      return false;
    },

    /**
     * Open new window with spritesheet as PNG
     */
    exportToPNG : function () {
      (new pskl.rendering.SpritesheetRenderer(frameSheet)).render();
    },

    uploadAsGIF : function () {
      var encoder = new GIFEncoder(),
          dpi = 8;
      encoder.setRepeat(0);
      encoder.setDelay(200);
      
      encoder.start();
      encoder.setSize(frameSheet.getWidth() * dpi, frameSheet.getHeight() * dpi);
      for (var i = 0 ; i < frameSheet.frames.length ; i++) {
        var frame = frameSheet.frames[i];
        var renderer = new pskl.rendering.CanvasRenderer(frame, dpi);
        encoder.addFrame(renderer.render());
      }
      encoder.finish();

      var imageData = 'data:image/gif;base64,' + encode64(encoder.stream().getData());
      var xhr = new XMLHttpRequest();
      var formData = new FormData();
      formData.append('data', imageData);
      xhr.open('POST', "http://screenletstore.appspot.com/__/upload", true);
      xhr.onload = function(e) {
        if (this.status == 200) {
          var baseUrl = window.open("http://screenletstore.appspot.com/img/" + this.responseText);
        }
      };

      xhr.send(formData);
    }
  };

  window.piskel = piskel;
  piskel.init();

})();
