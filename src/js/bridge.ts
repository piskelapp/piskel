import { type App, app } from "./app";
import { Frame } from "./model/Frame";
import { Layer } from "./model/Layer";
import { Piskel } from "./model/Piskel";
import { HistoryService } from "./service/HistoryService";
import { FrameUtils } from "./utils/FrameUtils";
import { colorToInt } from "./utils/core";

/**
 * Temporary: the globals used by piskel-boot.ts and by the e2e tests. Nothing
 * else in src may read them. To be removed when e2e tests stop using window.pskl.
 */
export type WindowBridge = {
  app: App;
  _releaseVersion: string | undefined;
  utils: { colorToInt: typeof colorToInt; FrameUtils: typeof FrameUtils };
  model: { Frame: typeof Frame; Layer: typeof Layer; Piskel: typeof Piskel };
  service: { HistoryService: typeof HistoryService };
};

window.pskl = {
  app,
  _releaseVersion: undefined,
  utils: { colorToInt, FrameUtils },
  model: { Frame, Layer, Piskel },
  service: { HistoryService }
};
