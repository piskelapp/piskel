import { Constants } from "../Constants";
import { Events } from "../Events";
import { app } from "../app";
import type { PublicPiskelController } from "../controller/piskel/PublicPiskelController";
import type { Frame } from "../model/Frame";
import { AsyncCachedFrameProcessor } from "../model/frame/AsyncCachedFrameProcessor";
import { FunctionUtils } from "../utils/FunctionUtils";
import { UserSettings } from "../utils/UserSettings";
import { assertDefined, colorToInt, intToHex } from "../utils/core";
import { FrameColors } from "../worker/framecolors/FrameColors";
import type {
  FrameColorsMap,
  FrameColorsResponse
} from "../worker/framecolors/FrameColorsWorker";
import type { PaletteService } from "./palette/PaletteService";

const batchAll = function (
  frames: Frame[],
  job: (frame: Frame) => Promise<FrameColorsMap>
): Promise<FrameColorsMap[]> {
  const batches: Frame[][] = [];
  frames = frames.slice(0);
  while (frames.length) {
    batches.push(frames.splice(0, 10));
  }
  let result: Promise<FrameColorsMap[]> = Promise.resolve([]);
  batches.forEach(function (batch) {
    result = result.then(function (results) {
      return Promise.all(batch.map(job)).then(function (partials) {
        return results.concat(partials);
      });
    });
  });
  return result;
};

export class CurrentColorsService {
  piskelController: PublicPiskelController;
  cache: Record<number, string[]>;
  currentColors: string[];
  cachedFrameProcessor: AsyncCachedFrameProcessor<FrameColorsMap>;
  throttledUpdateCurrentColors_: () => void;
  paletteService: PaletteService | undefined;

  constructor(piskelController: PublicPiskelController) {
    this.piskelController = piskelController;
    // cache of current colors by history state
    this.cache = {};
    this.currentColors = [];

    this.cachedFrameProcessor = new AsyncCachedFrameProcessor<FrameColorsMap>();
    this.cachedFrameProcessor.setFrameProcessor(
      this.getFrameColors_.bind(this)
    );

    this.throttledUpdateCurrentColors_ = FunctionUtils.throttle(
      this.updateCurrentColors_.bind(this),
      1000
    );

    this.paletteService = app.paletteService;
  }

  init(): void {
    $.subscribe(Events.HISTORY_STATE_SAVED, this.throttledUpdateCurrentColors_);
    $.subscribe(
      Events.HISTORY_STATE_LOADED,
      this.loadColorsFromCache_.bind(this)
    );
  }

  getCurrentColors(): string[] {
    return this.currentColors;
  }

  setCurrentColors(colors: string[]): void {
    const historyIndex = assertDefined(
      app.historyService,
      "historyService"
    ).currentIndex;
    this.cache[historyIndex] = colors;
    if (colors.join("") !== this.currentColors.join("")) {
      this.currentColors = colors;
      $.publish(Events.CURRENT_COLORS_UPDATED);
    }
  }

  updateCurrentColors_(): void {
    const layers = this.piskelController.getLayers();

    // Concatenate all frames in a single array.
    const frames = layers
      .map(function (l) {
        return l.getFrames();
      })
      .reduce(function (p, n) {
        return p.concat(n);
      });

    batchAll(frames, (frame: Frame) => {
      return this.cachedFrameProcessor.get(frame);
    }).then((results) => {
      const colors: Record<string, boolean> = {};
      results.forEach(function (result) {
        Object.keys(result).forEach(function (color: string) {
          colors[color] = true;
        });
      });
      // Remove transparent color from used colors
      delete colors[colorToInt(Constants.TRANSPARENT_COLOR)];

      const hexColors = Object.keys(colors).map(function (color: string) {
        return intToHex(Number(color));
      });
      this.setCurrentColors(hexColors);
    });
  }

  isCurrentColorsPaletteSelected_(): boolean | null {
    const paletteId = UserSettings.get(UserSettings.SELECTED_PALETTE);
    const palette = assertDefined(
      this.paletteService,
      "paletteService"
    ).getPaletteById(paletteId);

    return palette && palette.id === Constants.CURRENT_COLORS_PALETTE_ID;
  }

  loadColorsFromCache_(): void {
    const historyIndex = assertDefined(
      app.historyService,
      "historyService"
    ).currentIndex;
    const colors = this.cache[historyIndex];
    if (colors) {
      this.setCurrentColors(colors);
    }
  }

  getFrameColors_(
    frame: Frame,
    processorCallback: (colors: FrameColorsMap) => void
  ): void {
    const frameColorsWorker = new FrameColors(
      frame,
      function (event: MessageEvent<FrameColorsResponse>) {
        if (event.data.type === "SUCCESS") {
          processorCallback(event.data.colors);
        }
      },
      function () {},
      function () {
        processorCallback({});
      }
    );

    frameColorsWorker.process();
  }
}
