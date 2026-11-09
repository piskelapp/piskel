import { app } from "../../../../src/js/app";
import type { PublicPiskelController } from "../../../../src/js/controller/piskel/PublicPiskelController";
import { Frame } from "../../../../src/js/model/Frame";
import { Layer } from "../../../../src/js/model/Layer";
import { Piskel } from "../../../../src/js/model/Piskel";
import { Descriptor } from "../../../../src/js/model/piskel/Descriptor";
import { Deserializer } from "../../../../src/js/utils/serialization/Deserializer";
import { Serializer } from "../../../../src/js/utils/serialization/Serializer";
import { frameEqualsGrid, mock, toFrameGrid } from "../../testutils/TestUtils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("Serialization/Deserialization test", function () {
  beforeEach(function () {
    app.piskelController = mock<PublicPiskelController>({
      getFPS: function () {
        return 1;
      }
    });
  });

  afterEach(function () {
    delete app.piskelController;
  });

  it("serializes frames correctly", () =>
    new Promise<void>((done) => {
      // Create piskel.
      const descriptor = new Descriptor("piskelName", "piskelDesc");
      const piskel = new Piskel(1, 1, 1, descriptor);
      // Add layer.
      piskel.addLayer(new Layer("layer1"));
      // Add frame.
      piskel.getLayerAt(0).addFrame(
        Frame.fromPixelGrid(
          toFrameGrid([
            ["red", "black"],
            ["blue", "green"]
          ])
        )
      );

      // Verify the frame is successfully added in the layer.
      expect(piskel.getLayerAt(0).getFrames().length).toBe(1);

      const serializedPiskel = Serializer.serialize(piskel);

      const deserializer = Deserializer;
      deserializer.deserialize(JSON.parse(serializedPiskel), function (p) {
        // Check the frame has been properly deserialized
        expect(p.getLayerAt(0).getFrames().length).toBe(1);
        const frame = p.getLayerAt(0).getFrameAt(0);
        frameEqualsGrid(frame, [
          ["red", "black"],
          ["blue", "green"]
        ]);
        done();
      });
    }));

  it("serializes layer opacity", () =>
    new Promise<void>((done) => {
      const descriptor = new Descriptor("piskelName", "piskelDesc");
      const piskel = new Piskel(1, 1, 1, descriptor);

      piskel.addLayer(new Layer("layer1"));
      piskel.addLayer(new Layer("layer2"));
      piskel.addLayer(new Layer("layer3"));

      piskel.getLayerAt(0).setOpacity(0);
      piskel.getLayerAt(1).setOpacity(0.3);
      piskel.getLayerAt(2).setOpacity(0.9);

      const frame = new Frame(1, 1);
      piskel.getLayers().forEach(function (layer) {
        layer.addFrame(frame);
      });

      const serializedPiskel = Serializer.serialize(piskel);

      const deserializer = Deserializer;
      deserializer.deserialize(JSON.parse(serializedPiskel), function (p) {
        expect(p.getLayerAt(0).getOpacity()).toBe(0);
        expect(p.getLayerAt(1).getOpacity()).toBe(0.3);
        expect(p.getLayerAt(2).getOpacity()).toBe(0.9);

        // Check the serialization was successful
        expect(p.getLayerAt(0).getFrames().length).toBe(1);
        done();
      });
    }));
});
