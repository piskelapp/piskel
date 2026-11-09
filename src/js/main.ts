import "../css/main.css";
import "./bridge";
import { Constants } from "./Constants";
import { Events } from "./Events";
import { app } from "./app";
import { CanvasBackgroundController } from "./controller/CanvasBackgroundController";
import { CursorCoordinatesController } from "./controller/CursorCoordinatesController";
import { DrawingController } from "./controller/DrawingController";
import { FramesListController } from "./controller/FramesListController";
import { HeaderController } from "./controller/HeaderController";
import { LayersListController } from "./controller/LayersListController";
import { MinimapController } from "./controller/MinimapController";
import { NotificationController } from "./controller/NotificationController";
import { PaletteController } from "./controller/PaletteController";
import { PalettesListController } from "./controller/PalettesListController";
import { PenSizeController } from "./controller/PenSizeController";
import { ProgressBarController } from "./controller/ProgressBarController";
import { ToolController } from "./controller/ToolController";
import { TransformationsController } from "./controller/TransformationsController";
import { UserWarningController } from "./controller/UserWarningController";
import { DialogsController } from "./controller/dialogs/DialogsController";
import { PiskelController } from "./controller/piskel/PiskelController";
import { PublicPiskelController } from "./controller/piskel/PublicPiskelController";
import { PreviewController } from "./controller/preview/PreviewController";
import { SettingsController } from "./controller/settings/SettingsController";
import { DefaultSizeController } from "./controller/settings/resize/DefaultSizeController";
import { Frame } from "./model/Frame";
import { Layer } from "./model/Layer";
import { Piskel } from "./model/Piskel";
import { RenderedFrame } from "./model/frame/RenderedFrame";
import { Descriptor } from "./model/piskel/Descriptor";
import { DrawingLoop } from "./rendering/DrawingLoop";
import { PiskelRenderer } from "./rendering/PiskelRenderer";
import { SelectionManager } from "./selection/SelectionManager";
import { BackupService } from "./service/BackupService";
import { BeforeUnloadService } from "./service/BeforeUnloadService";
import { ClipboardService } from "./service/ClipboardService";
import { CurrentColorsService } from "./service/CurrentColorsService";
import { FileDropperService } from "./service/FileDropperService";
import { HistoryService } from "./service/HistoryService";
import { ImportService } from "./service/ImportService";
import { MouseStateService } from "./service/MouseStateService";
import { SavedStatusService } from "./service/SavedStatusService";
import { SelectedColorsService } from "./service/SelectedColorsService";
import { ShortcutService } from "./service/keyboard/ShortcutService";
import { CurrentColorsPalette } from "./service/palette/CurrentColorsPalette";
import { PaletteImportService } from "./service/palette/PaletteImportService";
import { PaletteService } from "./service/palette/PaletteService";
import { PenSizeService } from "./service/pensize/PenSizeService";
import { PerformanceReportService } from "./service/performance/PerformanceReportService";
import { DesktopStorageService } from "./service/storage/DesktopStorageService";
import { FileDownloadStorageService } from "./service/storage/FileDownloadStorageService";
import { IndexedDbStorageService } from "./service/storage/IndexedDbStorageService";
import { LocalStorageService } from "./service/storage/LocalStorageService";
import { StorageService } from "./service/storage/StorageService";
import { CanvasUtils } from "./utils/CanvasUtils";
import { Dom } from "./utils/Dom";
import { Environment } from "./utils/Environment";
import { FrameUtils } from "./utils/FrameUtils";
import { LayerUtils } from "./utils/LayerUtils";
import { UserAgent } from "./utils/UserAgent";
import { Uuid } from "./utils/Uuid";
import { Deserializer } from "./utils/serialization/Deserializer";

function initTooltips_(): void {
  $("body").tooltip({
    selector: "[rel=tooltip]"
  });
}

function init(): void {
  // This id is used to keep track of sessions in the BackupService.
  app.sessionId = Uuid.generate();

  const shortcutService = new ShortcutService();
  app.shortcutService = shortcutService;
  shortcutService.init();

  const size = DefaultSizeController.getDefaultSize();
  const fps = Constants.DEFAULT.FPS;
  const descriptor = new Descriptor("New Piskel", "");
  const piskel = new Piskel(size.width, size.height, fps, descriptor);

  const layer = new Layer("Layer 1");
  const frame = new Frame(size.width, size.height);

  layer.addFrame(frame);
  piskel.addLayer(layer);

  const corePiskelController = new PiskelController(piskel);
  app.corePiskelController = corePiskelController;
  corePiskelController.init();

  const piskelController = new PublicPiskelController(corePiskelController);
  app.piskelController = piskelController;
  piskelController.init();

  const paletteImportService = new PaletteImportService();
  app.paletteImportService = paletteImportService;
  paletteImportService.init();

  const paletteService = new PaletteService();
  app.paletteService = paletteService;
  paletteService.addDynamicPalette(new CurrentColorsPalette());

  const selectedColorsService = new SelectedColorsService();
  app.selectedColorsService = selectedColorsService;
  selectedColorsService.init();

  const mouseStateService = new MouseStateService();
  app.mouseStateService = mouseStateService;
  mouseStateService.init();

  const paletteController = new PaletteController();
  app.paletteController = paletteController;
  paletteController.init();

  const currentColorsService = new CurrentColorsService(piskelController);
  app.currentColorsService = currentColorsService;
  currentColorsService.init();

  const palettesListController = new PalettesListController(
    currentColorsService
  );
  app.palettesListController = palettesListController;
  palettesListController.init();

  const cursorCoordinatesController = new CursorCoordinatesController(
    piskelController
  );
  app.cursorCoordinatesController = cursorCoordinatesController;
  cursorCoordinatesController.init();

  const drawingController = new DrawingController(
    piskelController,
    Dom.getElement<HTMLElement>("#drawing-canvas-container")
  );
  app.drawingController = drawingController;
  drawingController.init();

  const previewController = new PreviewController(
    piskelController,
    Dom.getElement<HTMLElement>("#animated-preview-canvas-container")
  );
  app.previewController = previewController;
  previewController.init();

  const minimapController = new MinimapController(
    piskelController,
    previewController,
    drawingController,
    Dom.getElement<HTMLElement>(".minimap-container")
  );
  app.minimapController = minimapController;
  minimapController.init();

  const framesListController = new FramesListController(
    piskelController,
    Dom.getElement<HTMLElement>("#preview-list-wrapper")
  );
  app.framesListController = framesListController;
  framesListController.init();

  const layersListController = new LayersListController(piskelController);
  app.layersListController = layersListController;
  layersListController.init();

  const settingsController = new SettingsController(piskelController);
  app.settingsController = settingsController;
  settingsController.init();

  const dialogsController = new DialogsController(piskelController);
  app.dialogsController = dialogsController;
  dialogsController.init();

  const toolController = new ToolController();
  app.toolController = toolController;
  toolController.init();

  const selectionManager = new SelectionManager(piskelController);
  app.selectionManager = selectionManager;
  selectionManager.init();

  const historyService = new HistoryService(piskelController);
  app.historyService = historyService;
  historyService.init();

  const notificationController = new NotificationController();
  app.notificationController = notificationController;
  notificationController.init();

  const transformationsController = new TransformationsController();
  app.transformationsController = transformationsController;
  transformationsController.init();

  const progressBarController = new ProgressBarController();
  app.progressBarController = progressBarController;
  progressBarController.init();

  const canvasBackgroundController = new CanvasBackgroundController();
  app.canvasBackgroundController = canvasBackgroundController;
  canvasBackgroundController.init();

  const indexedDbStorageService = new IndexedDbStorageService(piskelController);
  app.indexedDbStorageService = indexedDbStorageService;
  indexedDbStorageService.init();

  const localStorageService = new LocalStorageService(piskelController);
  app.localStorageService = localStorageService;
  localStorageService.init();

  const fileDownloadStorageService = new FileDownloadStorageService();
  app.fileDownloadStorageService = fileDownloadStorageService;
  fileDownloadStorageService.init();

  const desktopStorageService = new DesktopStorageService(piskelController);
  app.desktopStorageService = desktopStorageService;
  desktopStorageService.init();

  const storageService = new StorageService(piskelController);
  app.storageService = storageService;
  storageService.init();

  const importService = new ImportService(piskelController);
  app.importService = importService;
  importService.init();

  const savedStatusService = new SavedStatusService(
    piskelController,
    historyService
  );
  app.savedStatusService = savedStatusService;
  savedStatusService.init();

  const backupService = new BackupService(piskelController);
  app.backupService = backupService;
  backupService.init();

  const beforeUnloadService = new BeforeUnloadService(piskelController);
  app.beforeUnloadService = beforeUnloadService;
  beforeUnloadService.init();

  const headerController = new HeaderController(
    piskelController,
    savedStatusService
  );
  app.headerController = headerController;
  headerController.init();

  const penSizeService = new PenSizeService();
  app.penSizeService = penSizeService;
  penSizeService.init();

  const penSizeController = new PenSizeController();
  app.penSizeController = penSizeController;
  penSizeController.init();

  const fileDropperService = new FileDropperService(piskelController);
  app.fileDropperService = fileDropperService;
  fileDropperService.init();

  const userWarningController = new UserWarningController(piskelController);
  app.userWarningController = userWarningController;
  userWarningController.init();

  const performanceReportService = new PerformanceReportService(
    piskelController,
    currentColorsService
  );
  app.performanceReportService = performanceReportService;
  performanceReportService.init();

  const clipboardService = new ClipboardService(piskelController);
  app.clipboardService = clipboardService;
  clipboardService.init();

  const drawingLoop = new DrawingLoop();
  app.drawingLoop = drawingLoop;
  drawingLoop.addCallback(render, undefined);
  drawingLoop.start();

  initTooltips_();

  $.subscribe(Events.EXTERNAL_PISKEL_READY, function () {
    const externalPiskel = window._externalPiskel;
    if (!externalPiskel) {
      console.error("No external piskel found");
      return;
    }
    Deserializer.deserialize(externalPiskel, (piskel: Piskel) => {
      piskelController.setPiskel(piskel);
    });
  });

  if (Environment.detectNodeWebkit() && UserAgent.isMac) {
    const gui = window.require("nw.gui");
    const mb = new gui.Menu({ type: "menubar" });
    mb.createMacBuiltin("Piskel");
    gui.Window.get().menu = mb;
  }

  if (!Environment.isIntegrationTest() && UserAgent.isUnsupported()) {
    $.publish(Events.DIALOG_SHOW, {
      dialogId: "unsupported-browser"
    });
  }

  function render(delta: number): void {
    drawingController.render();
    previewController.render(delta);
    framesListController.render();
  }

  app.getFirstFrameAsPng = function (): string {
    const frame = LayerUtils.mergeFrameAt(piskelController.getLayers(), 0);
    let canvas;
    if (frame instanceof RenderedFrame) {
      canvas = CanvasUtils.createFromImage(frame.getRenderedFrame());
    } else {
      canvas = FrameUtils.toImage(frame);
    }
    return canvas.toDataURL("image/png");
  };

  app.getFramesheetAsPng = function (): string {
    const renderer = new PiskelRenderer(piskelController);
    const framesheetCanvas = renderer.renderAsCanvas();
    return framesheetCanvas.toDataURL("image/png");
  };
}

app.init = init;
