import { Events, type SaveStateInfo } from "../Events";
import { app } from "../app";
import type { PiskelController } from "../controller/piskel/PiskelController";
import type { PublicPiskelController } from "../controller/piskel/PublicPiskelController";
import type { JQueryEvent } from "../lib/jquery-1.8.0";
import type { Piskel } from "../model/Piskel";
import { Uuid } from "../utils/Uuid";
import { assertDefined } from "../utils/core";
import { ArrayBufferDeserializer } from "../utils/serialization/arraybuffer/ArrayBufferDeserializer";
import { ArrayBufferSerializer } from "../utils/serialization/arraybuffer/ArrayBufferSerializer";
import type { ShortcutService } from "./keyboard/ShortcutService";
import { Shortcuts } from "./keyboard/Shortcuts";

export type HistoryState = {
  action: SaveStateInfo;
  frameIndex: number | undefined;
  layerIndex: number | undefined;
  fps: number;
  uuid: string;
  piskel?: ArrayBuffer;
};

export type HistorySerializer = {
  serialize(piskel: Piskel): ArrayBuffer;
};

export type HistoryDeserializer = {
  deserialize(data: ArrayBuffer, callback: (piskel: Piskel) => void): void;
};

export class HistoryService {
  piskelController: PiskelController;
  shortcutService: ShortcutService;
  deserializer: HistoryDeserializer;
  serializer: HistorySerializer;
  stateQueue: HistoryState[];
  currentIndex: number;
  lastLoadState: number;

  constructor(
    piskelController: PublicPiskelController,
    shortcutService?: ShortcutService,
    deserializer?: HistoryDeserializer,
    serializer?: HistorySerializer
  ) {
    // Use the real piskel controller that will not fire events when calling setters
    this.piskelController = piskelController.getWrappedPiskelController();

    this.shortcutService = assertDefined(
      shortcutService || app.shortcutService,
      "shortcutService"
    );
    this.deserializer = deserializer || ArrayBufferDeserializer;
    this.serializer = serializer || ArrayBufferSerializer;

    this.stateQueue = [];
    this.currentIndex = -1;
    this.lastLoadState = -1;
  }

  // Force to save a state as a SNAPSHOT
  static SNAPSHOT = "SNAPSHOT";

  // Default save state
  static REPLAY = "REPLAY";

  // Period (in number of state saved) between two snapshots
  static SNAPSHOT_PERIOD = 50;

  // Interval/buffer (in milliseconds) between two state load (ctrl+z/y spamming)
  static LOAD_STATE_INTERVAL = 50;

  // Maximum number of states that can be recorded.
  static MAX_SAVED_STATES = 500;

  init(): void {
    $.subscribe(Events.PISKEL_SAVE_STATE, this.onSaveStateEvent.bind(this));

    const shortcuts = Shortcuts;
    this.shortcutService.registerShortcut(
      shortcuts.MISC.UNDO,
      this.undo.bind(this)
    );
    this.shortcutService.registerShortcut(
      shortcuts.MISC.REDO,
      this.redo.bind(this)
    );

    this.saveState({
      type: HistoryService.SNAPSHOT
    });
  }

  onSaveStateEvent(evt: JQueryEvent, action: SaveStateInfo): void {
    this.saveState(action);
  }

  saveState(action: SaveStateInfo): void {
    this.stateQueue = this.stateQueue.slice(0, this.currentIndex + 1);
    this.currentIndex = this.currentIndex + 1;

    const state: HistoryState = {
      action: action,
      frameIndex: action.state
        ? action.state.frameIndex
        : this.piskelController.currentFrameIndex,
      layerIndex: action.state
        ? action.state.layerIndex
        : this.piskelController.currentLayerIndex,
      fps: this.piskelController.getFPS(),
      uuid: Uuid.generate()
    };

    const isSnapshot = action.type === HistoryService.SNAPSHOT;
    const isAtAutoSnapshotInterval =
      this.currentIndex % HistoryService.SNAPSHOT_PERIOD === 0;
    if (isSnapshot || isAtAutoSnapshotInterval) {
      const piskel = this.piskelController.getPiskel();
      state.piskel = this.serializer.serialize(piskel);
    }

    // If the new state pushes over MAX_SAVED_STATES, erase all states between the first and
    // second snapshot states.
    if (this.stateQueue.length > HistoryService.MAX_SAVED_STATES) {
      const firstSnapshotIndex = this.getNextSnapshotIndex_(1);
      this.stateQueue.splice(0, firstSnapshotIndex);
      this.currentIndex = this.currentIndex - firstSnapshotIndex;
    }
    this.stateQueue.push(state);
    $.publish(Events.HISTORY_STATE_SAVED);
  }

  getCurrentStateId(): string | false {
    const state = this.stateQueue[this.currentIndex];
    if (!state) {
      return false;
    }

    return state.uuid;
  }

  undo(): void {
    this.loadState(this.currentIndex - 1);
  }

  redo(): void {
    this.loadState(this.currentIndex + 1);
  }

  isLoadStateAllowed_(index: number): boolean {
    const timeOk =
      Date.now() - this.lastLoadState > HistoryService.LOAD_STATE_INTERVAL;
    const indexInRange = index >= 0 && index < this.stateQueue.length;
    return timeOk && indexInRange;
  }

  getPreviousSnapshotIndex_(index: number): number {
    while (this.stateQueue[index] && !this.stateQueue[index].piskel) {
      index = index - 1;
    }
    return index;
  }

  getNextSnapshotIndex_(index: number): number {
    while (this.stateQueue[index] && !this.stateQueue[index].piskel) {
      index = index + 1;
    }
    return index;
  }

  loadState(index: number): void {
    try {
      if (this.isLoadStateAllowed_(index)) {
        this.lastLoadState = Date.now();

        const snapshotIndex = this.getPreviousSnapshotIndex_(index);
        if (snapshotIndex < 0) {
          throw "Could not find previous SNAPSHOT saved in history stateQueue";
        }
        const serializedPiskel = assertDefined(
          this.getSnapshotFromState_(snapshotIndex),
          "serializedPiskel"
        );
        const onPiskelLoadedCb = this.onPiskelLoaded_.bind(
          this,
          index,
          snapshotIndex
        );
        this.deserializer.deserialize(serializedPiskel, onPiskelLoadedCb);
      }
    } catch (error) {
      console.error("[CRITICAL ERROR] : Unable to load a history state.");
      this.logError_(error);
      this.stateQueue = [];
      this.currentIndex = -1;
    }
  }

  logError_(error: unknown): void {
    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    } else {
      console.error(error);
    }
  }

  getSnapshotFromState_(stateIndex: number): ArrayBuffer | undefined {
    const state = this.stateQueue[stateIndex];
    const piskelSnapshot = state.piskel;

    state.piskel = piskelSnapshot;

    return piskelSnapshot;
  }

  onPiskelLoaded_(index: number, snapshotIndex: number, piskel: Piskel): void {
    const originalSize = this.getPiskelSize_();
    piskel.setDescriptor(this.piskelController.getPiskel().getDescriptor());
    // propagate save path to the new piskel instance
    piskel.savePath = this.piskelController.getPiskel().savePath;
    this.piskelController.setPiskel(piskel);

    for (let i = snapshotIndex + 1; i <= index; i++) {
      const state = this.stateQueue[i];
      this.setupState(state);
      this.replayState(state);
    }

    // Should only do this when going backwards
    const lastState = this.stateQueue[index + 1];
    if (lastState) {
      this.setupState(lastState);
    }

    this.currentIndex = index;
    $.publish(Events.PISKEL_RESET);
    $.publish(Events.HISTORY_STATE_LOADED);
    if (originalSize !== this.getPiskelSize_()) {
      $.publish(Events.FRAME_SIZE_CHANGED);
    }
  }

  getPiskelSize_(): string {
    return (
      this.piskelController.getWidth() + "x" + this.piskelController.getHeight()
    );
  }

  setupState(state: HistoryState): void {
    this.piskelController.setCurrentFrameIndex(Number(state.frameIndex));
    this.piskelController.setCurrentLayerIndex(Number(state.layerIndex));
    this.piskelController.setFPS(state.fps);
  }

  replayState(state: HistoryState): void {
    const action = state.action;
    const layer = this.piskelController.getLayerAt(Number(state.layerIndex));
    const frame = layer.getFrameAt(Number(state.frameIndex));
    assertDefined(action.scope, "scope").replay(frame, action.replay);
  }
}
