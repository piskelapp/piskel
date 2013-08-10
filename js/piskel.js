/**
 * @require Constants
 * @require Events
 */
(function () {
  var ns = $.namespace("pskl");
  /**
   * FrameSheetModel instance.
   */
  var frameSheet;
  /**
   * Main application controller
   */
  ns.app = {

    init : function () {
      var frameSize = this.readSizeFromURL_();
      frameSheet = new pskl.model.FrameSheet(frameSize.height, frameSize.width);
      frameSheet.addEmptyFrame();
      frameSheet.setCurrentFrameIndex(0);

      /**
       * True when piskel is running in static mode (no back end needed).
       * When started from APP Engine, appEngineToken_ (Boolean) should be set on window.pskl
       */
      this.isStaticVersion = !pskl.appEngineToken_;

      this.drawingController = new pskl.controller.DrawingController(frameSheet, $('#drawing-canvas-container'));
      this.drawingController.init();

      this.animationController = new pskl.controller.AnimatedPreviewController(frameSheet, $('#preview-canvas-container'));
      this.animationController.init();
      
      this.previewsController = new pskl.controller.PreviewFilmController(frameSheet, $('#preview-list'));
      this.previewsController.init();

      this.settingsController = new pskl.controller.SettingsController();
      this.settingsController.init();

      this.selectionManager = new pskl.selection.SelectionManager(frameSheet);
      this.selectionManager.init();

      this.historyService = new pskl.service.HistoryService(frameSheet);
      this.historyService.init();

      this.keyboardEventService = new pskl.service.KeyboardEventService();
      this.keyboardEventService.init();

      this.notificationController = new pskl.controller.NotificationController();
      this.notificationController.init();

      this.localStorageService = new pskl.service.LocalStorageService(frameSheet);
      this.localStorageService.init();

      this.toolController = new pskl.controller.ToolController();
      this.toolController.init();
      
      this.paletteController = new pskl.controller.PaletteController();
      this.paletteController.init(frameSheet);

      var drawingLoop = new pskl.rendering.DrawingLoop();
      drawingLoop.addCallback(this.render, this);
      drawingLoop.start();

      // Init (event-delegated) bootstrap tooltips:
      $('body').tooltip({
        selector: '[rel=tooltip]'
      });

      
      /**
       * True when piskel is running in static mode (no back end needed).
       * When started from APP Engine, appEngineToken_ (Boolean) should be set on window.pskl
       */
      this.isStaticVersion = !pskl.appEngineToken_;

      if (this.isStaticVersion) {
        var framesheetId = this.readFramesheetIdFromURL_();
        if (framesheetId) {
          $.publish(Events.SHOW_NOTIFICATION, [{
            "content" : "Loading animation with id : [" + framesheetId + "]"
          }]);
          this.loadFramesheetFromService(framesheetId);
        } else {
          this.localStorageService.displayRestoreNotification();
        }
      } else {
        if (pskl.framesheetData_ && pskl.framesheetData_.content) {
          frameSheet.load(pskl.framesheetData_.content);
          pskl.app.animationController.setFPS(pskl.framesheetData_.fps);
        }
      }
    },

    render : function (delta) {
      this.drawingController.render(delta);
      this.animationController.render(delta);
      this.previewsController.render(delta);
    },
    
    readSizeFromURL_ : function () {
      var sizeParam = this.readUrlParameter_("size"),
        size;
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

    readFramesheetIdFromURL_ : function () {
      return this.readUrlParameter_("frameId");
    },

    readUrlParameter_ : function (paramName) {
      var searchString = window.location.search.substring(1),
        i, val, params = searchString.split("&");

      for (i = 0; i < params.length; i++) {
        val = params[i].split("=");
        if (val[0] == paramName) {
          return window.unescape(val[1]);
        }
      }
      return "";
    },

    loadFramesheetFromService : function (frameId) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', Constants.PISKEL_SERVICE_URL + '/get?l=' + frameId, true);
      xhr.responseType = 'text';

      xhr.onload = function (e) {
        var res = JSON.parse(this.responseText);
        frameSheet.load(res.framesheet);
        pskl.app.animationController.setFPS(res.fps);
        $.publish(Events.HIDE_NOTIFICATION);
      };

      xhr.onerror = function () {
        $.publish(Events.HIDE_NOTIFICATION);
      };

      xhr.send();
    },

    getFirstFrameAsPNGData_ : function () {
      var tmpSheet = new pskl.model.FrameSheet(frameSheet.getHeight(), frameSheet.getWidth());
      tmpSheet.addFrame(frameSheet.getFrameByIndex(0));
      return (new pskl.rendering.SpritesheetRenderer(tmpSheet)).renderAsImageDataSpritesheetPNG();
    },

    // TODO(julz): Create package ?
    storeSheet : function (event) {
      var xhr = new XMLHttpRequest();
      var formData = new FormData();
      formData.append('framesheet_content', frameSheet.serialize());
      formData.append('fps_speed', $('#preview-fps').val());

      if (this.isStaticVersion) {
        // anonymous save on old app-engine backend
        xhr.open('POST', Constants.PISKEL_SERVICE_URL + "/store", true);
      } else {
        // additional values only used with latest app-engine backend
        formData.append('name', $('#piskel-name').val());
        formData.append('frames', frameSheet.getFrameCount());
        // Get image/png data for first frame
       
        formData.append('preview', this.getFirstFrameAsPNGData_());

        var imageData = (new pskl.rendering.SpritesheetRenderer(frameSheet)).renderAsImageDataSpritesheetPNG();
        formData.append('framesheet', imageData);

        xhr.open('POST', "save", true);
      }
     
      xhr.onload = function(e) {
        if (this.status == 200) {
          if (pskl.app.isStaticVersion) {
            var baseUrl = window.location.href.replace(window.location.search, "");
            window.location.href = baseUrl + "?frameId=" + this.responseText;
          } else {
            $.publish(Events.SHOW_NOTIFICATION, [{"content": "Successfully saved !"}]);
          }
        } else {
          this.onerror(e);
        }
      };
      xhr.onerror = function(e) {
        $.publish(Events.SHOW_NOTIFICATION, [{"content": "Saving failed ("+this.status+")"}]);
      };
      xhr.send(formData);

      if(event) {
        event.stopPropagation();
        event.preventDefault();
      }
      return false;
    },

    uploadToScreenletstore : function (imageData) {
      var xhr = new XMLHttpRequest();
      var formData = new FormData();
      formData.append('data', imageData);
      xhr.open('POST', "http://screenletstore.appspot.com/__/upload", true);
      var cloudURL;
      var that = this;
      xhr.onload = function (e) {
        if (this.status == 200) {
          cloudURL = "http://screenletstore.appspot.com/img/" + this.responseText;
          that.openWindow(cloudURL);
        }
      };

      xhr.send(formData);
    },

    uploadAsAnimatedGIF : function () {
      var fps = pskl.app.animationController.fps;
      var renderer = new pskl.rendering.SpritesheetRenderer(frameSheet);
      var cb = this.uploadToScreenletstore.bind(this);

      renderer.renderAsImageDataAnimatedGIF(fps, cb);
    },

    uploadAsSpritesheetPNG : function () {
      var imageData = (new pskl.rendering.SpritesheetRenderer(frameSheet)).renderAsImageDataSpritesheetPNG();
      this.uploadToScreenletstore(imageData);
    },

    openWindow : function (url) {
      var options = [
        "dialog=yes", "scrollbars=no", "status=no",
        "width=" + frameSheet.getWidth() * frameSheet.getFrameCount(),
        "height=" + frameSheet.getHeight()
      ].join(",");

      window.open(url, "piskel-export", options);
    }
  };
})();
