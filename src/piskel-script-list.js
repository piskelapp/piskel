// This list is used both by the grunt build and index.html (in debug mode)

(typeof exports != "undefined" ? exports : pskl_exports).scripts = [
  // Core libraries
  "js/lib/jquery-1.8.0.js","js/lib/jquery-ui-1.10.3.custom.js","js/lib/pubsub.js","js/lib/bootstrap/bootstrap.js",

  // Application wide configuration
  "js/Constants.js",
  "js/Events.js",

  // Libraries
  "js/utils/core.js",
  "js/utils/UserAgent.js",
  "js/utils/Base64.js",
  "js/utils/BlobUtils.js",
  "js/utils/CanvasUtils.js",
  "js/utils/DateUtils.js",
  "js/utils/Dom.js",
  "js/utils/Math.js",
  "js/utils/FileUtils.js",
  "js/utils/FrameUtils.js",
  "js/utils/LayerUtils.js",
  "js/utils/ImageResizer.js",
  "js/utils/PixelUtils.js",
  "js/utils/PiskelFileUtils.js",
  "js/utils/Template.js",
  "js/utils/UserSettings.js",
  "js/utils/serialization/Serializer.js",
  "js/utils/serialization/Deserializer.js",
  "js/utils/serialization/backward/Deserializer_v0.js",
  "js/utils/serialization/backward/Deserializer_v1.js",

    // GIF Encoding libraries
  "js/lib/gif/gif.worker.js",
  "js/lib/gif/gif.js",
  "js/lib/gif/libgif.js",

  // JSZip https://github.com/Stuk/jszip
  "js/lib/jszip/jszip.min.js",

  // Spectrum color-picker library
  "js/lib/spectrum/spectrum.js",

  // Application libraries-->
  "js/rendering/DrawingLoop.js",

  // Models
  "js/model/Frame.js",
  "js/model/Layer.js",
  "js/model/piskel/Descriptor.js",
  "js/model/frame/CachedFrameProcessor.js",
  "js/model/Piskel.js",

  // Selection
  "js/selection/SelectionManager.js",
  "js/selection/BaseSelection.js",
  "js/selection/RectangularSelection.js",
  "js/selection/ShapeSelection.js",

  // Rendering
  "js/rendering/AbstractRenderer.js",
  "js/rendering/CompositeRenderer.js",
  "js/rendering/layer/LayersRenderer.js",
  "js/rendering/frame/FrameRenderer.js",
  "js/rendering/OnionSkinRenderer.js",
  "js/rendering/frame/TiledFrameRenderer.js",
  "js/rendering/frame/CachedFrameRenderer.js",
  "js/rendering/CanvasRenderer.js",
  "js/rendering/FramesheetRenderer.js",
  "js/rendering/PiskelRenderer.js",

  // Controllers
  "js/controller/piskel/PiskelController.js",
  "js/controller/piskel/PublicPiskelController.js",
  "js/controller/CursorCoordinatesController.js",
  "js/controller/DrawingController.js",
  "js/controller/PreviewFilmController.js",
  "js/controller/LayersListController.js",
  "js/controller/AnimatedPreviewController.js",
  "js/controller/MinimapController.js",
  "js/controller/ToolController.js",
  "js/controller/PaletteController.js",
  "js/controller/PalettesListController.js",
  "js/controller/NotificationController.js",
  "js/controller/CanvasBackgroundController.js",

  // Settings sub-controllers
  "js/controller/settings/ApplicationSettingsController.js",
  "js/controller/settings/ResizeController.js",
  "js/controller/settings/ImageExportController.js",
  "js/controller/settings/GifExportController.js",
  "js/controller/settings/PngExportController.js",
  "js/controller/settings/SaveController.js",
  "js/controller/settings/ImportController.js",

  // Settings controller
  "js/controller/settings/SettingsController.js",

  // Dialogs sub-controllers
  "js/controller/dialogs/AbstractDialogController.js",
  "js/controller/dialogs/PaletteManagerController.js",
  "js/controller/dialogs/ImportImageController.js",
  "js/controller/dialogs/BrowseLocalController.js",

  // Dialogs controller
  "js/controller/dialogs/DialogsController.js",

  // Services
  "js/service/LocalStorageService.js",
  "js/service/GithubStorageService.js",
  "js/service/AppEngineStorageService.js",
  "js/service/BackupService.js",
  "js/service/BeforeUnloadService.js",
  "js/service/HistoryService.js",
  "js/service/SavedStatusService.js",
  "js/service/keyboard/ShortcutService.js",
  "js/service/keyboard/KeycodeTranslator.js",
  "js/service/keyboard/CheatsheetService.js",
  "js/service/ImageUploadService.js",
  "js/service/CurrentColorsService.js",
  "js/service/FileDropperService.js",

  // Tools
  "js/drawingtools/BaseTool.js",
  "js/drawingtools/ShapeTool.js",
  "js/drawingtools/SimplePen.js",
  "js/drawingtools/Lighten.js",
  "js/drawingtools/VerticalMirrorPen.js",
  "js/drawingtools/Eraser.js",
  "js/drawingtools/Stroke.js",
  "js/drawingtools/PaintBucket.js",
  "js/drawingtools/Rectangle.js",
  "js/drawingtools/Circle.js",
  "js/drawingtools/Move.js",
  "js/drawingtools/selectiontools/BaseSelect.js",
  "js/drawingtools/selectiontools/RectangleSelect.js",
  "js/drawingtools/selectiontools/ShapeSelect.js",
  "js/drawingtools/ColorPicker.js",
  "js/drawingtools/ColorSwap.js",

  // Devtools
  "js/devtools/MouseEvent.js",
  "js/devtools/TestRecorder.js",
  "js/devtools/TestRecordPlayer.js",
  "js/devtools/TestRecordController.js",
  "js/devtools/DrawingTestRunner.js",

  // Application controller and initialization
  "js/app.js",
  // Bonus features !!
  "js/snippets.js"
];