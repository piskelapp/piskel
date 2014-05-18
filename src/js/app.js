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
      /**
       * True when piskel is running in static mode (no back end needed).
       * When started from APP Engine, appEngineToken_ (Boolean) should be set on window.pskl
       */
      this.isAppEngineVersion = !!pskl.appEngineToken_;

      this.shortcutService = new pskl.service.keyboard.ShortcutService();
      this.shortcutService.init();

      var size = this.readSizeFromURL_();

      var descriptor = new pskl.model.piskel.Descriptor('New Piskel', '');
      var piskel = new pskl.model.Piskel(size.width, size.height, descriptor);

      var layer = new pskl.model.Layer("Layer 1");
      var frame = new pskl.model.Frame(size.width, size.height);
      layer.addFrame(frame);

      piskel.addLayer(layer);

      this.corePiskelController = new pskl.controller.piskel.PiskelController(piskel);
      this.corePiskelController.init();

      this.piskelController = new pskl.controller.piskel.PublicPiskelController(this.corePiskelController);
      this.piskelController.init();

      this.paletteController = new pskl.controller.PaletteController();
      this.paletteController.init();

      this.currentColorsService = new pskl.service.CurrentColorsService(this.piskelController);
      this.currentColorsService.init();

      this.palettesListController = new pskl.controller.PalettesListController(this.paletteController, this.currentColorsService);
      this.palettesListController.init();

      this.cursorCoordinatesController = new pskl.controller.CursorCoordinatesController(this.piskelController);
      this.cursorCoordinatesController.init();

      this.drawingController = new pskl.controller.DrawingController(this.piskelController, this.paletteController, $('#drawing-canvas-container'));
      this.drawingController.init();

      this.animationController = new pskl.controller.AnimatedPreviewController(this.piskelController, $('#animated-preview-canvas-container'));
      this.animationController.init();

      this.minimapController = new pskl.controller.MinimapController(this.piskelController, this.animationController, this.drawingController, $('#animated-preview-canvas-container'));
      this.minimapController.init();

      this.previewFilmController = new pskl.controller.PreviewFilmController(this.piskelController, $('#preview-list'));
      this.previewFilmController.init();

      this.layersListController = new pskl.controller.LayersListController(this.piskelController);
      this.layersListController.init();

      this.settingsController = new pskl.controller.settings.SettingsController(this.piskelController);
      this.settingsController.init();

      this.dialogsController = new pskl.controller.dialogs.DialogsController(this.piskelController);
      this.dialogsController.init();

      this.toolController = new pskl.controller.ToolController();
      this.toolController.init();

      this.selectionManager = new pskl.selection.SelectionManager(this.piskelController);
      this.selectionManager.init();

      this.historyService = new pskl.service.HistoryService(this.corePiskelController);
      this.historyService.init();

      this.notificationController = new pskl.controller.NotificationController();
      this.notificationController.init();

      this.canvasBackgroundController = new pskl.controller.CanvasBackgroundController();
      this.canvasBackgroundController.init();

      this.localStorageService = new pskl.service.LocalStorageService(this.piskelController);
      this.localStorageService.init();

      this.imageUploadService = new pskl.service.ImageUploadService();
      this.imageUploadService.init();

      this.cheatsheetService = new pskl.service.keyboard.CheatsheetService();
      this.cheatsheetService.init();

      this.savedStatusService = new pskl.service.SavedStatusService(this.piskelController);
      this.savedStatusService.init();


      if (this.isAppEngineVersion) {
        this.storageService = new pskl.service.AppEngineStorageService(this.piskelController);
      } else {
        this.storageService = new pskl.service.GithubStorageService(this.piskelController);
      }
      this.storageService.init();


      var drawingLoop = new pskl.rendering.DrawingLoop();
      drawingLoop.addCallback(this.render, this);
      drawingLoop.start();

      this.initTooltips_();

      if (this.isAppEngineVersion) {
        this.finishInitAppEngine_();
      } else {
        this.finishInitGithub_();
      }
    },

    finishInitGithub_ : function () {
      var framesheetId = this.readFramesheetIdFromURL_();
      if (framesheetId) {
        $.publish(Events.SHOW_NOTIFICATION, [{
          "content" : "Loading animation with id : [" + framesheetId + "]"
        }]);
        this.loadFramesheetFromService(framesheetId);
      }
    },

    finishInitAppEngine_ : function () {
      if (pskl.appEnginePiskelData_ && pskl.appEnginePiskelData_.piskel) {
        pskl.utils.serialization.Deserializer.deserialize(pskl.appEnginePiskelData_.piskel, function (piskel) {
          piskel.setDescriptor(pskl.appEnginePiskelData_.descriptor);
          pskl.app.piskelController.setPiskel(piskel);
          pskl.app.animationController.setFPS(pskl.appEnginePiskelData_.fps);
        });
      }
    },

    isLoggedIn : function () {
      return pskl.appEnginePiskelData_ && pskl.appEnginePiskelData_.isLoggedIn;
    },

    initTooltips_ : function () {
      $('body').tooltip({
        selector: '[rel=tooltip]'
      });
    },

    render : function (delta) {
      this.drawingController.render(delta);
      this.animationController.render(delta);
      this.previewFilmController.render(delta);
    },

    readSizeFromURL_ : function () {
      var sizeParam = this.readUrlParameter_("size");
      var size;
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
      var searchString = window.location.search.substring(1);
      var params = searchString.split("&");
      for (var i = 0; i < params.length; i++) {
        var param = params[i].split("=");
        if (param[0] == paramName) {
          return window.unescape(param[1]);
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
        pskl.utils.serialization.Deserializer.deserialize(res.framesheet, function (piskel) {
          pskl.app.piskelController.setPiskel(piskel);
          pskl.app.animationController.setFPS(res.fps);

          $.publish(Events.HIDE_NOTIFICATION);
        });
      };

      xhr.onerror = function () {
        $.publish(Events.HIDE_NOTIFICATION);
      };

      xhr.send();
    },

    store : function (callbacks) {
      this.storageService.store(callbacks);
    },

    getFirstFrameAsPng : function () {
      var firstFrame = this.piskelController.getFrameAt(0);
      var canvasRenderer = new pskl.rendering.CanvasRenderer(firstFrame, 1);
      canvasRenderer.drawTransparentAs('rgba(0,0,0,0)');
      var firstFrameCanvas = canvasRenderer.render();
      return firstFrameCanvas.toDataURL("image/png");
    },

    getFramesheetAsPng : function () {
      var renderer = new pskl.rendering.PiskelRenderer(this.piskelController);
      var framesheetCanvas = renderer.renderAsCanvas();
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
