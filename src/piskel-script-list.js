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
  "js/utils/Array.js",
  "js/utils/Base64.js",
  "js/utils/BlobUtils.js",
  "js/utils/CanvasUtils.js",
  "js/utils/DateUtils.js",
  "js/utils/Dom.js",
  "js/utils/Event.js",
  "js/utils/Environment.js",
  "js/utils/Math.js",
  "js/utils/FileUtils.js",
  "js/utils/FileUtilsDesktop.js",
  "js/utils/FrameTransform.js",
  "js/utils/FrameUtils.js",
  "js/utils/LayerUtils.js",
  "js/utils/ImageResizer.js",
  "js/utils/PixelUtils.js",
  "js/utils/PiskelFileUtils.js",
  "js/utils/Template.js",
  "js/utils/TooltipFormatter.js",
  "js/utils/UserSettings.js",
  "js/utils/Uuid.js",
  "js/utils/WorkerUtils.js",
  "js/utils/Xhr.js",
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
  "js/model/Palette.js",
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
  "js/controller/drawing/DragHandler.js",
  "js/controller/FramesListController.js",
  "js/controller/LayersListController.js",
  "js/controller/preview/PopupPreviewController.js",
  "js/controller/preview/PreviewController.js",
  "js/controller/MinimapController.js",
  "js/controller/ToolController.js",
  "js/controller/PaletteController.js",
  "js/controller/PalettesListController.js",
  "js/controller/ProgressBarController.js",
  "js/controller/NotificationController.js",
  "js/controller/TransformationsController.js",
  "js/controller/CanvasBackgroundController.js",

  // Settings sub-controllers
  "js/controller/settings/AbstractSettingController.js",
  "js/controller/settings/ApplicationSettingsController.js",
  "js/controller/settings/exportimage/ImageExportController.js",
  "js/controller/settings/exportimage/GifExportController.js",
  "js/controller/settings/exportimage/PngExportController.js",
  "js/controller/settings/resize/AnchorWidget.js",
  "js/controller/settings/resize/ResizeController.js",
  "js/controller/settings/resize/DefaultSizeController.js",
  "js/controller/settings/SaveController.js",
  "js/controller/settings/ImportController.js",

  // Settings controller
  "js/controller/settings/SettingsController.js",

  // Dialogs sub-controllers
  "js/controller/dialogs/AbstractDialogController.js",
  "js/controller/dialogs/CreatePaletteController.js",
  "js/controller/dialogs/ImportImageController.js",
  "js/controller/dialogs/BrowseLocalController.js",


  // Dialogs controller
  "js/controller/dialogs/DialogsController.js",

  // Widgets
  "js/widgets/ColorsList.js",
  "js/widgets/HslRgbColorPicker.js",

  // Services
  "js/service/LocalStorageService.js",
  "js/service/GithubStorageService.js",
  "js/service/AppEngineStorageService.js",
  "js/service/DesktopStorageService.js",
  "js/service/BackupService.js",
  "js/service/BeforeUnloadService.js",
  "js/service/HistoryService.js",
  "js/service/color/ColorSorter.js",
  "js/service/palette/CurrentColorsPalette.js",
  "js/service/palette/PaletteService.js",
  "js/service/palette/PaletteGplWriter.js",
  "js/service/palette/reader/AbstractPaletteFileReader.js",
  "js/service/palette/reader/PaletteGplReader.js",
  "js/service/palette/reader/PaletteImageReader.js",
  "js/service/palette/reader/PalettePalReader.js",
  "js/service/palette/reader/PaletteTxtReader.js",
  "js/service/palette/PaletteImportService.js",
  "js/service/SavedStatusService.js",
  "js/service/keyboard/ShortcutService.js",
  "js/service/keyboard/KeycodeTranslator.js",
  "js/service/keyboard/CheatsheetService.js",
  "js/service/ImageUploadService.js",
  "js/service/CurrentColorsService.js",
  "js/service/FileDropperService.js",

  // Tools
  "js/tools/Tool.js",
  "js/tools/IconMarkupRenderer.js",
  "js/tools/drawing/BaseTool.js",
  "js/tools/drawing/ShapeTool.js",
  "js/tools/drawing/SimplePen.js",
  "js/tools/drawing/Lighten.js",
  "js/tools/drawing/VerticalMirrorPen.js",
  "js/tools/drawing/Eraser.js",
  "js/tools/drawing/Stroke.js",
  "js/tools/drawing/PaintBucket.js",
  "js/tools/drawing/Rectangle.js",
  "js/tools/drawing/Circle.js",
  "js/tools/drawing/Move.js",
  "js/tools/drawing/selection/BaseSelect.js",
  "js/tools/drawing/selection/RectangleSelect.js",
  "js/tools/drawing/selection/ShapeSelect.js",
  "js/tools/drawing/ColorPicker.js",
  "js/tools/drawing/ColorSwap.js",
  "js/tools/transform/Transform.js",
  "js/tools/transform/Clone.js",
  "js/tools/transform/Flip.js",
  "js/tools/transform/Rotate.js",

  // Devtools
  "js/devtools/DrawingTestPlayer.js",
  "js/devtools/DrawingTestRecorder.js",
  "js/devtools/DrawingTestRunner.js",
  "js/devtools/DrawingTestSuiteController.js",
  "js/devtools/DrawingTestSuiteRunner.js",
  "js/devtools/MouseEvent.js",
  "js/devtools/TestRecordController.js",
  "js/devtools/init.js",

  // Workers
  "js/worker/hash/HashWorker.js",
  "js/worker/hash/Hash.js",
  "js/worker/imageprocessor/ImageProcessorWorker.js",
  "js/worker/imageprocessor/ImageProcessor.js",

  // Application controller and initialization
  "js/app.js",
  // Bonus features !!
  "js/snippets.js"
];