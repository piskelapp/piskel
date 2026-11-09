import { Constants } from "../../Constants";
import type { Frame } from "../../model/Frame";
import { Layer } from "../../model/Layer";
import { Piskel } from "../../model/Piskel";
import { Descriptor } from "../../model/piskel/Descriptor";
import { type ChunkFrame, FrameUtils } from "../FrameUtils";
import { assertDefined } from "../core";
import {
  Deserializer_v0,
  type SerializedPiskelV0
} from "./backward/Deserializer_v0";
import {
  Deserializer_v1,
  type SerializedPiskelV1
} from "./backward/Deserializer_v1";

export type DeserializeCallback = (piskel: Piskel) => void;

export type LayerChunk = { base64PNG: string; layout: number[][] };

export type SerializedLayer = {
  name: string;
  opacity: number;
  frameCount: number;
  base64PNG?: string;
  chunks?: LayerChunk[];
};

export type SerializedPiskel = {
  modelVersion: number;
  piskel: {
    name?: string;
    description?: string;
    fps?: number;
    height: number;
    width: number;
    layers: string[];
    hiddenFrames?: number[];
  };
};

export type SerializedData =
  | SerializedPiskel
  | SerializedPiskelV1
  | SerializedPiskelV0;

const isCurrentVersion = function (
  data: SerializedData
): data is SerializedPiskel {
  return !Array.isArray(data) && data.modelVersion == Constants.MODEL_VERSION;
};

const isVersion1 = function (data: SerializedData): data is SerializedPiskelV1 {
  return !Array.isArray(data) && data.modelVersion == 1;
};

export class Deserializer {
  layersToLoad_: number;
  data_: SerializedPiskel;
  callback_: DeserializeCallback;
  piskel_: Piskel | null;
  layers_: Layer[];
  hiddenFrames: number[] | undefined;

  constructor(data: SerializedPiskel, callback: DeserializeCallback) {
    this.layersToLoad_ = 0;
    this.data_ = data;
    this.callback_ = callback;
    this.piskel_ = null;
    this.layers_ = [];
  }

  static deserialize(
    data: SerializedData,
    onSuccess: DeserializeCallback,
    onError?: (error: unknown) => void
  ): void {
    try {
      let deserializer;
      if (isCurrentVersion(data)) {
        deserializer = new Deserializer(data, onSuccess);
      } else if (isVersion1(data)) {
        deserializer = new Deserializer_v1(data, onSuccess);
      } else {
        deserializer = new Deserializer_v0(data, onSuccess);
      }
      deserializer.deserialize();
    } catch (e) {
      console.error(e);
      if (typeof onError === "function") {
        onError(e);
      }
    }
  }

  deserialize(): void {
    const data = this.data_;
    const piskelData = data.piskel;
    const name = piskelData.name || "Deserialized piskel";
    const description = piskelData.description || "";
    const fps = typeof piskelData.fps != "undefined" ? piskelData.fps : 12;

    const descriptor = new Descriptor(name, description);
    this.piskel_ = new Piskel(
      piskelData.width,
      piskelData.height,
      fps,
      descriptor
    );
    this.hiddenFrames = piskelData.hiddenFrames || [];

    this.layersToLoad_ = piskelData.layers.length;
    piskelData.layers.forEach(this.deserializeLayer.bind(this));
  }

  deserializeLayer(layerString: string, index: number): Layer {
    const layerData: SerializedLayer = JSON.parse(layerString);
    const layer = new Layer(layerData.name);
    layer.setOpacity(layerData.opacity);

    // Backward compatibility: if the layerData is not chunked but contains a single base64PNG,
    // create a fake chunk, expected to represent all frames side-by-side.
    if (typeof layerData.chunks === "undefined" && layerData.base64PNG) {
      this.normalizeLayerData_(layerData);
    }

    const chunks = assertDefined(layerData.chunks, "chunks");

    // Prepare a frames array to store frame objects extracted from the chunks.
    const frames: Frame[] = [];
    Promise.all(
      chunks.map(function (chunk: LayerChunk) {
        // Create a promise for each chunk.
        return new Promise<void>(function (resolve) {
          const image = new Image();
          // Load the chunk image in an Image object.
          image.onload = function () {
            // extract the chunkFrames from the chunk image
            const chunkFrames = FrameUtils.createFramesFromChunk(
              image,
              chunk.layout
            );
            // add each image to the frames array, at the extracted index
            chunkFrames.forEach(function (chunkFrame: ChunkFrame) {
              frames[chunkFrame.index] = chunkFrame.frame;
            });
            resolve();
          };
          image.src = chunk.base64PNG;
        });
      })
    )
      .then(() => {
        frames.forEach(function (frame: Frame) {
          layer.addFrame(frame);
        });
        this.layers_[index] = layer;
        this.onLayerLoaded_();
      })
      .catch(function (error: Error) {
        console.error("Failed to deserialize layer");
        console.error(error);
      });

    return layer;
  }

  onLayerLoaded_(): void {
    this.layersToLoad_ = this.layersToLoad_ - 1;
    if (this.layersToLoad_ === 0) {
      this.layers_.forEach((layer: Layer) => {
        assertDefined(this.piskel_, "piskel_").addLayer(layer);
      });
      const piskel = assertDefined(this.piskel_, "piskel_");
      piskel.hiddenFrames = assertDefined(this.hiddenFrames, "hiddenFrames");
      this.callback_(piskel);
    }
  }

  /**
   * Backward comptibility only. Create a chunk for layerData objects that only contain
   * an single base64PNG without chunk/layout information.
   */
  normalizeLayerData_(layerData: SerializedLayer): void {
    const layout: number[][] = [];
    for (let i = 0; i < layerData.frameCount; i++) {
      layout.push([i]);
    }
    layerData.chunks = [
      {
        base64PNG: assertDefined(layerData.base64PNG, "base64PNG"),
        layout: layout
      }
    ];
  }
}
