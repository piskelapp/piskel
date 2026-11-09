import { Constants } from "../../../Constants";
import { Frame, type PixelGrid } from "../../../model/Frame";
import { Layer } from "../../../model/Layer";
import { Piskel } from "../../../model/Piskel";
import { Descriptor } from "../../../model/piskel/Descriptor";

export type SerializedPiskelV0 = PixelGrid[];

export class Deserializer_v0 {
  data_: SerializedPiskelV0;
  callback_: (piskel: Piskel) => void;

  constructor(data: SerializedPiskelV0, callback: (piskel: Piskel) => void) {
    this.data_ = data;
    this.callback_ = callback;
  }

  deserialize(): void {
    const pixelGrids = this.data_;
    const frames = pixelGrids.map(function (grid: PixelGrid) {
      return Frame.fromPixelGrid(grid);
    });
    const descriptor = new Descriptor("Deserialized piskel", "");
    const layer = Layer.fromFrames("Layer 1", frames);

    this.callback_(
      Piskel.fromLayers([layer], Constants.DEFAULT.FPS, descriptor)
    );
  }
}
