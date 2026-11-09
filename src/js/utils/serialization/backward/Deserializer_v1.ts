import { Constants } from "../../../Constants";
import { Frame, type PixelGrid } from "../../../model/Frame";
import { Layer } from "../../../model/Layer";
import { Piskel } from "../../../model/Piskel";
import { Descriptor } from "../../../model/piskel/Descriptor";

export type SerializedPiskelV1 = {
  modelVersion: number;
  piskel: { width: number; height: number; layers: string[] };
};

export class Deserializer_v1 {
  callback_: (piskel: Piskel) => void;
  data_: SerializedPiskelV1;

  constructor(data: SerializedPiskelV1, callback: (piskel: Piskel) => void) {
    this.callback_ = callback;
    this.data_ = data;
  }

  deserialize(): void {
    const piskelData = this.data_.piskel;
    const descriptor = new Descriptor("Deserialized piskel", "");
    const piskel = new Piskel(
      piskelData.width,
      piskelData.height,
      Constants.DEFAULT.FPS,
      descriptor
    );

    piskelData.layers.forEach((serializedLayer: string) => {
      const layer = this.deserializeLayer(serializedLayer);
      piskel.addLayer(layer);
    });

    this.callback_(piskel);
  }

  deserializeLayer(layerString: string): Layer {
    const layerData: { name: string; frames: string[] } =
      JSON.parse(layerString);
    const layer = new Layer(layerData.name);
    layerData.frames.forEach((serializedFrame: string) => {
      const frame = this.deserializeFrame(serializedFrame);
      layer.addFrame(frame);
    });

    return layer;
  }

  deserializeFrame(frameString: string): Frame {
    const framePixelGrid: PixelGrid = JSON.parse(frameString);
    return Frame.fromPixelGrid(framePixelGrid);
  }
}
