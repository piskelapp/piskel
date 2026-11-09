import type { DrawingController } from "./controller/DrawingController";
import type { Frame } from "./model/Frame";
import type { BaseSelection } from "./selection/BaseSelection";
import type { PerformanceReport } from "./service/performance/PerformanceReport";
import type { BaseTool } from "./tools/drawing/BaseTool";

export type DialogShowInfo = { dialogId: string; initArgs?: unknown };

export type NotificationInfo = {
  content: string;
  hideDelay?: number;
  behavior?: string;
};

export type ProgressInfo = { name: string };
export type ProgressUpdate = { progress: number | string };

export type UserSettingValue = string | number | boolean | object | null;

/** An object able to replay a recorded action on a frame. */
export type Replayable = {
  replay(frame: Frame, replayData: unknown): void;
};

export type StateInfo = { frameIndex: number; layerIndex: number };

export type SaveStateInfo = {
  type: string;
  scope?: Replayable;
  replay?: unknown;
  state?: StateInfo;
};

/** Maps each event to the arguments its subscribers receive. */
export type EventArgs = {
  TOOL_SELECTED: [tool: BaseTool];
  SELECT_TOOL: [toolId: string];
  TOOL_RELEASED: [];
  TOOL_PRESSED: [];
  SELECT_PRIMARY_COLOR: [color: string];
  SELECT_SECONDARY_COLOR: [color: string];
  PRIMARY_COLOR_SELECTED: [color: string];
  SECONDARY_COLOR_SELECTED: [color: string];
  CURSOR_MOVED: [x: number, y: number];
  DRAG_START: [col: number, row: number];
  DRAG_END: [];
  DIALOG_SHOW: [info: DialogShowInfo];
  DIALOG_HIDE: [];
  PALETTE_LIST_UPDATED: [];
  USER_SETTINGS_CHANGED: [name: string, value: UserSettingValue];
  SHORTCUTS_CHANGED: [];
  CLOSE_SETTINGS_DRAWER: [];
  PISKEL_RESET: [];
  PISKEL_SAVE_STATE: [info: SaveStateInfo];
  PISKEL_DESCRIPTOR_UPDATED: [];
  PISKEL_SAVED_STATUS_UPDATE: [];
  HISTORY_STATE_SAVED: [];
  HISTORY_STATE_LOADED: [];
  PEN_SIZE_CHANGED: [];
  PISKEL_SAVED: [];
  BEFORE_SAVING_PISKEL: [];
  AFTER_SAVING_PISKEL: [];
  FRAME_SIZE_CHANGED: [];
  FPS_CHANGED: [];
  SELECTION_CREATED: [selection: BaseSelection];
  SELECTION_MOVE_REQUEST: [colDiff: number, rowDiff: number];
  SELECTION_DISMISSED: [];
  CLIPBOARD_COPY: [event?: ClipboardEvent];
  CLIPBOARD_CUT: [event?: ClipboardEvent];
  CLIPBOARD_PASTE: [event?: ClipboardEvent];
  SHOW_NOTIFICATION: [info: NotificationInfo];
  HIDE_NOTIFICATION: [];
  SHOW_PROGRESS: [info: ProgressInfo];
  UPDATE_PROGRESS: [info: ProgressUpdate];
  HIDE_PROGRESS: [];
  ZOOM_CHANGED: [];
  EXPORT_SCALE_CHANGED: [];
  CURRENT_COLORS_UPDATED: [];
  PERFORMANCE_REPORT_CHANGED: [report: PerformanceReport];
  PISKEL_FILE_IMPORT_FAILED: [reason: string];
  MOUSE_EVENT: [event: MouseEvent, controller: DrawingController];
  KEYBOARD_EVENT: [event: KeyboardEvent];
  TRANSFORMATION_EVENT: [toolId: string, event: MouseEvent];
  EXTERNAL_PISKEL_READY: [];
};

export type EventName = keyof EventArgs;

/**
 * jQuery's trigger takes the arguments as an array, or a single argument
 * directly: both forms exist in the calls to $.publish.
 */
type PublishForm<T extends unknown[]> = T extends []
  ? []
  : T extends [infer Only]
    ? [Only] | [T]
    : T extends [(infer Only)?]
      ? [] | [Only] | [T]
      : [T];

export type PublishArgs<E extends EventName> = PublishForm<EventArgs[E]>;

export const Events: { [K in EventName]: K } = {
  TOOL_SELECTED: "TOOL_SELECTED",
  SELECT_TOOL: "SELECT_TOOL",

  TOOL_RELEASED: "TOOL_RELEASED",
  TOOL_PRESSED: "TOOL_PRESSED",
  SELECT_PRIMARY_COLOR: "SELECT_PRIMARY_COLOR",
  SELECT_SECONDARY_COLOR: "SELECT_SECONDARY_COLOR",
  PRIMARY_COLOR_SELECTED: "PRIMARY_COLOR_SELECTED",
  SECONDARY_COLOR_SELECTED: "SECONDARY_COLOR_SELECTED",

  CURSOR_MOVED: "CURSOR_MOVED",
  DRAG_START: "DRAG_START",
  DRAG_END: "DRAG_END",

  DIALOG_SHOW: "DIALOG_SHOW",
  DIALOG_HIDE: "DIALOG_HIDE",

  PALETTE_LIST_UPDATED: "PALETTE_LIST_UPDATED",

  /**
   * Fired each time a user setting change.
   * The payload will be:
   *   1st argument: Name of the settings
   *   2nd argument: New value
   */
  USER_SETTINGS_CHANGED: "USER_SETTINGS_CHANGED",
  SHORTCUTS_CHANGED: "SHORTCUTS_CHANGED",

  CLOSE_SETTINGS_DRAWER: "CLOSE_SETTINGS_DRAWER",

  /**
   * The framesheet was reseted and is now probably drastically different.
   * Number of frames, content of frames, color used for the palette may have changed.
   */
  PISKEL_RESET: "PISKEL_RESET",
  PISKEL_SAVE_STATE: "PISKEL_SAVE_STATE",
  PISKEL_DESCRIPTOR_UPDATED: "PISKEL_DESCRIPTOR_UPDATED",
  PISKEL_SAVED_STATUS_UPDATE: "PISKEL_SAVED_STATUS_UPDATE",

  HISTORY_STATE_SAVED: "HISTORY_STATE_SAVED",
  HISTORY_STATE_LOADED: "HISTORY_STATE_LOADED",

  PEN_SIZE_CHANGED: "PEN_SIZE_CHANGED",

  /**
   * Fired when a Piskel is successfully saved
   */
  PISKEL_SAVED: "PISKEL_SAVED",
  /**
   * Fired when a save action starts
   */
  BEFORE_SAVING_PISKEL: "BEFORE_SAVING_PISKEL",
  /**
   * Fired when a save action ends. Always fires, even if saving was not successful
   */
  AFTER_SAVING_PISKEL: "AFTER_SAVING_PISKEL",

  FRAME_SIZE_CHANGED: "FRAME_SIZE_CHANGED",
  FPS_CHANGED: "FPS_CHANGED",

  SELECTION_CREATED: "SELECTION_CREATED",
  SELECTION_MOVE_REQUEST: "SELECTION_MOVE_REQUEST",
  SELECTION_DISMISSED: "SELECTION_DISMISSED",

  CLIPBOARD_COPY: "CLIPBOARD_COPY",
  CLIPBOARD_CUT: "CLIPBOARD_CUT",
  CLIPBOARD_PASTE: "CLIPBOARD_PASTE",

  SHOW_NOTIFICATION: "SHOW_NOTIFICATION",
  HIDE_NOTIFICATION: "HIDE_NOTIFICATION",

  SHOW_PROGRESS: "SHOW_PROGRESS",
  UPDATE_PROGRESS: "UPDATE_PROGRESS",
  HIDE_PROGRESS: "HIDE_PROGRESS",

  ZOOM_CHANGED: "ZOOM_CHANGED",
  EXPORT_SCALE_CHANGED: "EXPORT_SCALE_CHANGED",

  CURRENT_COLORS_UPDATED: "CURRENT_COLORS_UPDATED",

  PERFORMANCE_REPORT_CHANGED: "PERFORMANCE_REPORT_CHANGED",

  PISKEL_FILE_IMPORT_FAILED: "PISKEL_FILE_IMPORT_FAILED",

  // A mouse event happened on the drawing area
  MOUSE_EVENT: "MOUSE_EVENT",
  // A keyboard shortcut was used
  KEYBOARD_EVENT: "KEYBOARD_EVENT",
  // A transform tool, such as flip or rotate, is about to be applied
  TRANSFORMATION_EVENT: "TRANSFORMATION_EVENT",

  // A piskel external to the editor has been loaded and attached
  // to window._externalPiskel to be applied.
  EXTERNAL_PISKEL_READY: "EXTERNAL_PISKEL_READY"
};
