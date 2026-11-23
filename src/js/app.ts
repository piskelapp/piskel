import type { CanvasBackgroundController } from "./controller/CanvasBackgroundController";
import type { CursorCoordinatesController } from "./controller/CursorCoordinatesController";
import type { DrawingController } from "./controller/DrawingController";
import type { FramesListController } from "./controller/FramesListController";
import type { HeaderController } from "./controller/HeaderController";
import type { LayersListController } from "./controller/LayersListController";
import type { MinimapController } from "./controller/MinimapController";
import type { NotificationController } from "./controller/NotificationController";
import type { PaletteController } from "./controller/PaletteController";
import type { PalettesListController } from "./controller/PalettesListController";
import type { PenSizeController } from "./controller/PenSizeController";
import type { ProgressBarController } from "./controller/ProgressBarController";
import type { ToolController } from "./controller/ToolController";
import type { TransformationsController } from "./controller/TransformationsController";
import type { UserWarningController } from "./controller/UserWarningController";
import type { DialogsController } from "./controller/dialogs/DialogsController";
import type { PiskelController } from "./controller/piskel/PiskelController";
import type { PublicPiskelController } from "./controller/piskel/PublicPiskelController";
import type { PreviewController } from "./controller/preview/PreviewController";
import type { SettingsController } from "./controller/settings/SettingsController";
import type { DrawingLoop } from "./rendering/DrawingLoop";
import type { SelectionManager } from "./selection/SelectionManager";
import type { BackupService } from "./service/BackupService";
import type { BeforeUnloadService } from "./service/BeforeUnloadService";
import type { ClipboardService } from "./service/ClipboardService";
import type { CurrentColorsService } from "./service/CurrentColorsService";
import type { FileDropperService } from "./service/FileDropperService";
import type { HistoryService } from "./service/HistoryService";
import type { ImportService } from "./service/ImportService";
import type { MouseStateService } from "./service/MouseStateService";
import type { SavedStatusService } from "./service/SavedStatusService";
import type { SelectedColorsService } from "./service/SelectedColorsService";
import type { ShortcutService } from "./service/keyboard/ShortcutService";
import type { PaletteImportService } from "./service/palette/PaletteImportService";
import type { PaletteService } from "./service/palette/PaletteService";
import type { PenSizeService } from "./service/pensize/PenSizeService";
import type { PerformanceReportService } from "./service/performance/PerformanceReportService";
import type { DesktopStorageService } from "./service/storage/DesktopStorageService";
import type { FileDownloadStorageService } from "./service/storage/FileDownloadStorageService";
import type { IndexedDbStorageService } from "./service/storage/IndexedDbStorageService";
import type { LocalStorageService } from "./service/storage/LocalStorageService";
import type { StorageService } from "./service/storage/StorageService";

export type App = {
  sessionId: string | undefined;
  shortcutService: ShortcutService | undefined;
  corePiskelController: PiskelController | undefined;
  piskelController: PublicPiskelController | undefined;
  paletteImportService: PaletteImportService | undefined;
  paletteService: PaletteService | undefined;
  selectedColorsService: SelectedColorsService | undefined;
  mouseStateService: MouseStateService | undefined;
  paletteController: PaletteController | undefined;
  currentColorsService: CurrentColorsService | undefined;
  palettesListController: PalettesListController | undefined;
  cursorCoordinatesController: CursorCoordinatesController | undefined;
  drawingController: DrawingController | undefined;
  previewController: PreviewController | undefined;
  minimapController: MinimapController | undefined;
  framesListController: FramesListController | undefined;
  layersListController: LayersListController | undefined;
  settingsController: SettingsController | undefined;
  dialogsController: DialogsController | undefined;
  toolController: ToolController | undefined;
  selectionManager: SelectionManager | undefined;
  historyService: HistoryService | undefined;
  notificationController: NotificationController | undefined;
  transformationsController: TransformationsController | undefined;
  progressBarController: ProgressBarController | undefined;
  canvasBackgroundController: CanvasBackgroundController | undefined;
  indexedDbStorageService: IndexedDbStorageService | undefined;
  localStorageService: LocalStorageService | undefined;
  fileDownloadStorageService: FileDownloadStorageService | undefined;
  desktopStorageService: DesktopStorageService | undefined;
  storageService: StorageService | undefined;
  importService: ImportService | undefined;
  savedStatusService: SavedStatusService | undefined;
  backupService: BackupService | undefined;
  beforeUnloadService: BeforeUnloadService | undefined;
  headerController: HeaderController | undefined;
  penSizeService: PenSizeService | undefined;
  penSizeController: PenSizeController | undefined;
  fileDropperService: FileDropperService | undefined;
  userWarningController: UserWarningController | undefined;
  performanceReportService: PerformanceReportService | undefined;
  clipboardService: ClipboardService | undefined;
  drawingLoop: DrawingLoop | undefined;
  init: (() => void) | undefined;
  getFirstFrameAsPng: (() => string) | undefined;
  getFramesheetAsPng: (() => string) | undefined;
};

/**
 * Holds the controllers and services of the application. It only declares them,
 * main.ts creates them during init, which keeps the modules free of import cycles.
 */
export const app: App = {
  sessionId: undefined,
  shortcutService: undefined,
  corePiskelController: undefined,
  piskelController: undefined,
  paletteImportService: undefined,
  paletteService: undefined,
  selectedColorsService: undefined,
  mouseStateService: undefined,
  paletteController: undefined,
  currentColorsService: undefined,
  palettesListController: undefined,
  cursorCoordinatesController: undefined,
  drawingController: undefined,
  previewController: undefined,
  minimapController: undefined,
  framesListController: undefined,
  layersListController: undefined,
  settingsController: undefined,
  dialogsController: undefined,
  toolController: undefined,
  selectionManager: undefined,
  historyService: undefined,
  notificationController: undefined,
  transformationsController: undefined,
  progressBarController: undefined,
  canvasBackgroundController: undefined,
  indexedDbStorageService: undefined,
  localStorageService: undefined,
  fileDownloadStorageService: undefined,
  desktopStorageService: undefined,
  storageService: undefined,
  importService: undefined,
  savedStatusService: undefined,
  backupService: undefined,
  beforeUnloadService: undefined,
  headerController: undefined,
  penSizeService: undefined,
  penSizeController: undefined,
  fileDropperService: undefined,
  userWarningController: undefined,
  performanceReportService: undefined,
  clipboardService: undefined,
  drawingLoop: undefined,
  init: undefined,
  getFirstFrameAsPng: undefined,
  getFramesheetAsPng: undefined
};
