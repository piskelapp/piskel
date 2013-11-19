/**
 * @require Constants
 * @require Events
 */
(function () {
  var ns = $.namespace("pskl");
  /**
   * Main application controller
   */
  ns.app = {

    init : function () {
      this.shortcutService = new pskl.service.keyboard.ShortcutService();
      this.shortcutService.init();

      var size = this.readSizeFromURL_();
      var piskel = new pskl.model.Piskel(size.width, size.height);

      var layer = new pskl.model.Layer("Layer 1");
      var frame = new pskl.model.Frame(size.width, size.height);
      layer.addFrame(frame);

      piskel.addLayer(layer);

      this.piskelController = new pskl.controller.PiskelController(piskel);
      this.piskelController.init();

      this.paletteController = new pskl.controller.PaletteController();
      this.paletteController.init();

      this.drawingController = new pskl.controller.DrawingController(this.piskelController, this.paletteController, $('#drawing-canvas-container'));
      this.drawingController.init();

      this.animationController = new pskl.controller.AnimatedPreviewController(this.piskelController, $('#preview-canvas-container'));
      this.animationController.init();

      this.previewsController = new pskl.controller.PreviewFilmController(this.piskelController, $('#preview-list'));
      this.previewsController.init();

      this.layersListController = new pskl.controller.LayersListController(this.piskelController);
      this.layersListController.init();

      this.settingsController = new pskl.controller.settings.SettingsController(this.piskelController);
      this.settingsController.init();

      this.toolController = new pskl.controller.ToolController();
      this.toolController.init();

      this.selectionManager = new pskl.selection.SelectionManager(this.piskelController);
      this.selectionManager.init();

      this.historyService = new pskl.service.HistoryService(this.piskelController);
      this.historyService.init();

      this.notificationController = new pskl.controller.NotificationController();
      this.notificationController.init();

      this.localStorageService = new pskl.service.LocalStorageService(this.piskelController);
      this.localStorageService.init();

      this.imageUploadService = new pskl.service.ImageUploadService();
      this.imageUploadService.init();


      this.cheatsheetService = new pskl.service.keyboard.CheatsheetService();
      this.cheatsheetService.init();


      var drawingLoop = new pskl.rendering.DrawingLoop();
      drawingLoop.addCallback(this.render, this);
      drawingLoop.start();

      this.initBootstrapTooltips_();

      /**
       * True when piskel is running in static mode (no back end needed).
       * When started from APP Engine, appEngineToken_ (Boolean) should be set on window.pskl
       */
      this.isStaticVersion = !pskl.appEngineToken_;

      if (this.isStaticVersion) {
        this.finishInitStatic_();
      } else {
        this.finishInitAppEngine_();
      }
    },

    finishInitStatic_ : function () {
      var framesheetId = this.readFramesheetIdFromURL_();
      if (framesheetId) {
        $.publish(Events.SHOW_NOTIFICATION, [{
          "content" : "Loading animation with id : [" + framesheetId + "]"
        }]);
        this.loadFramesheetFromService(framesheetId);
      } else {
        this.localStorageService.displayRestoreNotification();
      }
    },

    finishInitAppEngine_ : function () {
      if (pskl.framesheetData_ && pskl.framesheetData_.content) {
        var piskel = pskl.utils.Serializer.createPiskel(pskl.framesheetData_.content);
        pskl.app.piskelController.setPiskel(piskel);
        pskl.app.animationController.setFPS(pskl.framesheetData_.fps);
      }
    },

    initBootstrapTooltips_ : function () {
      $('body').tooltip({
        selector: '[rel=tooltip]'
      });
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
        size = {
          height : Constants.DEFAULT.HEIGHT,
          width : Constants.DEFAULT.WIDTH
        };
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
      xhr.open('GET', Constants.STATIC.URL.GET + '?l=' + frameId, true);
      xhr.responseType = 'text';
      xhr.onload = function (e) {
        var res = JSON.parse(this.responseText);
        var piskel = pskl.utils.Serializer.createPiskel(res.framesheet);
        pskl.app.piskelController.setPiskel(piskel);
        pskl.app.animationController.setFPS(res.fps);
        $.publish(Events.HIDE_NOTIFICATION);
      };

      xhr.onerror = function () {
        $.publish(Events.HIDE_NOTIFICATION);
      };

      xhr.send();
    },

    storeSheet : function (event) {
      if (this.isStaticVersion) {
        this.storeSheetStatic_();
      } else {
        this.storeSheetAppEngine_();
      }

      if(event) {
        event.stopPropagation();
        event.preventDefault();
      }
      return false;
    },

    storeSheetStatic_ : function () {
      var xhr = new XMLHttpRequest();
      var formData = new FormData();
      formData.append('framesheet_content', this.piskelController.serialize());
      formData.append('fps_speed', $('#preview-fps').val());

      xhr.open('POST', Constants.STATIC.URL.SAVE, true);

      xhr.onload = function(e) {
        if (this.status == 200) {
          var baseUrl = window.location.href.replace(window.location.search, "");
          window.location.href = baseUrl + "?frameId=" + this.responseText;
        } else {
          this.onerror(e);
        }
      };
      xhr.onerror = function(e) {
        $.publish(Events.SHOW_NOTIFICATION, [{"content": "Saving failed ("+this.status+")"}]);
      };
      xhr.send(formData);
    },

    storeSheetAppEngine_ : function () {
      var xhr = new XMLHttpRequest();
      var formData = new FormData();
      formData.append('framesheet_content', this.piskelController.serialize());
      formData.append('fps_speed', $('#preview-fps').val());
      formData.append('name', $('#piskel-name').val());
      formData.append('frames', this.piskelController.getFrameCount());
      formData.append('preview', this.getFirstFrameAsPng());
      formData.append('framesheet', this.getFramesheetAsPng());

      xhr.open('POST', Constants.APPENGINE.URL.SAVE, true);

      xhr.onload = function(e) {
        if (this.status == 200) {
          $.publish(Events.SHOW_NOTIFICATION, [{"content": "Successfully saved !"}]);
        } else {
          this.onerror(e);
        }
      };
      xhr.onerror = function(e) {
        $.publish(Events.SHOW_NOTIFICATION, [{"content": "Saving failed ("+this.status+")"}]);
      };
      xhr.send(formData);
    },

    getFirstFrameAsPng : function () {
      var firstFrame = this.piskelController.getFrameAt(0);
      var frameRenderer = new pskl.rendering.CanvasRenderer(firstFrame, 1);
      frameRenderer.drawTransparentAs('rgba(0,0,0,0)');
      var firstFrameCanvas = frameRenderer.render().canvas;
      return firstFrameCanvas.toDataURL("image/png");
    },

    getFramesheetAsPng : function () {
      var renderer = new pskl.rendering.SpritesheetRenderer(this.piskelController);
      var framesheetCanvas = renderer.render();
      return framesheetCanvas.toDataURL("image/png");
    },

    uploadAsSpritesheetPNG : function () {
      var imageData = this.getFramesheetAsPng();
      this.imageUploadService.upload(imageData, this.openWindow.bind(this));
    },

    openWindow : function (url) {
      var options = [
        "dialog=yes", "scrollbars=no", "status=no",
        "width=" + this.piskelController.getWidth() * this.piskelController.getFrameCount(),
        "height=" + this.piskelController.getHeight()
      ].join(",");

      window.open(url, "piskel-export", options);
    }
  };
})();
