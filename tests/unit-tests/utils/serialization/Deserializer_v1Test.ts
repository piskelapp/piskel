import { Constants } from "../../../../src/js/Constants";
import { Deserializer } from "../../../../src/js/utils/serialization/Deserializer";
import { frameEqualsGrid } from "../../testutils/TestUtils";
import { describe, expect, it } from "vitest";

describe("Deserializer v1 test", function () {
  const B = "#000000";
  const T = Constants.TRANSPARENT_COLOR;
  const data = {
    modelVersion: 1,
    piskel: {
      height: 2,
      width: 2,
      layers: [
        '{"name":"Layer 1","frames":["[[\\"#000000\\",\\"TRANSPARENT\\"],[\\"TRANSPARENT\\",\\"#000000\\"]]"]}'
      ]
    }
  };

  it("deserializes data serialized for model v0 correctly", () =>
    new Promise<void>((done) => {
      const deserializer = Deserializer;
      deserializer.deserialize(data, function (p) {
        // Check the frame has been properly deserialized
        expect(p.getLayerAt(0).getFrames().length).toBe(1);
        const frame = p.getLayerAt(0).getFrameAt(0);
        frameEqualsGrid(frame, [
          [B, T],
          [T, B]
        ]);
        done();
      });
    }));
});
