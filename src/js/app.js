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
       * When started from APP Engine, appEngineToken_ (Boolean) should be set on window.pskl
       */
      this.isAppEngineVersion = !!pskl.appEngineToken_;

      this.shortcutService = new pskl.service.keyboard.ShortcutService();
      this.shortcutService.init();

      var size = pskl.UserSettings.get(pskl.UserSettings.DEFAULT_SIZE);
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

      this.paletteImportService = new pskl.service.palette.PaletteImportService();
      this.paletteService = new pskl.service.palette.PaletteService();
      this.paletteService.addDynamicPalette(new pskl.service.palette.CurrentColorsPalette());

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

      this.previewController = new pskl.controller.preview.PreviewController(this.piskelController, $('#animated-preview-canvas-container'));
      this.previewController.init();

      this.minimapController = new pskl.controller.MinimapController(this.piskelController, this.previewController, this.drawingController, $('.minimap-container'));
      this.minimapController.init();

      this.framesListController = new pskl.controller.FramesListController(this.piskelController, $('#preview-list'));
      this.framesListController.init();

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

      this.transformationsController = new pskl.controller.TransformationsController();
      this.transformationsController.init();

      this.progressBarController = new pskl.controller.ProgressBarController();
      this.progressBarController.init();

      this.canvasBackgroundController = new pskl.controller.CanvasBackgroundController();
      this.canvasBackgroundController.init();

      this.localStorageService = new pskl.service.LocalStorageService(this.piskelController);
      this.localStorageService.init();

      this.desktopStorageService = new pskl.service.DesktopStorageService(this.piskelController);
      this.desktopStorageService.init();

      this.imageUploadService = new pskl.service.ImageUploadService();
      this.imageUploadService.init();

      this.cheatsheetService = new pskl.service.keyboard.CheatsheetService();
      this.cheatsheetService.init();

      this.savedStatusService = new pskl.service.SavedStatusService(this.piskelController);
      this.savedStatusService.init();

      this.backupService = new pskl.service.BackupService(this.piskelController);
      this.backupService.init();

      this.beforeUnloadService = new pskl.service.BeforeUnloadService(this.piskelController);
      this.beforeUnloadService.init();

      this.fileDropperService = new pskl.service.FileDropperService(this.piskelController, $('#drawing-canvas-container').get(0));
      this.fileDropperService.init();

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

      var piskelData = this.getPiskelInitData_();
      if (piskelData && piskelData.piskel) {
        this.loadPiskel_(piskelData.piskel, piskelData.descriptor, piskelData.fps);
      }

      if (pskl.devtools) {
        pskl.devtools.init();
      }
    },

    loadPiskel_ : function (serializedPiskel, descriptor, fps) {
      pskl.utils.serialization.Deserializer.deserialize(serializedPiskel, function (piskel) {
        piskel.setDescriptor(descriptor);
        pskl.app.piskelController.setPiskel(piskel);
        pskl.app.previewController.setFPS(fps);
      });
    },

    getPiskelInitData_ : function () {
      return pskl.appEnginePiskelData_;
    },

    isLoggedIn : function () {
      var piskelData = this.getPiskelInitData_();
      return piskelData && piskelData.isLoggedIn;
    },

    initTooltips_ : function () {
      $('body').tooltip({
        selector: '[rel=tooltip]'
      });
    },

    render : function (delta) {
      this.drawingController.render(delta);
      this.previewController.render(delta);
      this.framesListController.render(delta);
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
    }
  };
})();

