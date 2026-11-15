describe("ArrayBuffer serialization/deserialization test", function () {
  var serializer = pskl.utils.serialization.arraybuffer.ArrayBufferSerializer;
  var deserializer = pskl.utils.serialization.arraybuffer.ArrayBufferDeserializer;
  var toFrameGrid = test.testutils.toFrameGrid;
  var frameEqualsGrid = test.testutils.frameEqualsGrid;

  var toFrame = function (grid) {
    return pskl.model.Frame.fromPixelGrid(toFrameGrid(grid));
  };

  var buildPiskel = function () {
    var descriptor = new pskl.model.piskel.Descriptor("sprite name", "desc");
    var piskel = new pskl.model.Piskel(3, 2, 8, descriptor);
    piskel.addLayer(new pskl.model.Layer("layer1"));
    piskel.addLayer(new pskl.model.Layer("layer2"));
    piskel.getLayerAt(0).addFrame(
      toFrame([
        ["red", "black", "transparent"],
        ["blue", "green", "white"]
      ])
    );
    piskel.getLayerAt(0).addFrame(
      toFrame([
        ["white", "white", "white"],
        ["black", "black", "black"]
      ])
    );
    piskel.getLayerAt(1).addFrame(
      toFrame([
        ["transparent", "red", "red"],
        ["red", "white", "transparent"]
      ])
    );
    piskel.getLayerAt(1).addFrame(
      toFrame([
        ["green", "green", "blue"],
        ["blue", "green", "green"]
      ])
    );
    return piskel;
  };

  it("roundtrips pixels exactly for multiple layers and frames", function () {
    var piskel = buildPiskel();
    var serializedPiskel = serializer.serialize(piskel);

    var deserialized = null;
    deserializer.deserialize(serializedPiskel, function (p) {
      deserialized = p;
    });

    expect(deserialized).not.toBe(null);
    expect(deserialized.getWidth()).toBe(3);
    expect(deserialized.getHeight()).toBe(2);
    expect(deserialized.getFPS()).toBe(8);
    expect(deserialized.getDescriptor().name).toBe("sprite name");
    expect(deserialized.getDescriptor().description).toBe("desc");
    expect(deserialized.getLayers().length).toBe(2);

    // Every frame pixel must be preserved byte for byte.
    for (var l = 0; l < 2; l++) {
      for (var f = 0; f < 2; f++) {
        var original = piskel.getLayerAt(l).getFrameAt(f);
        var restored = deserialized.getLayerAt(l).getFrameAt(f);
        expect(Array.from(restored.getPixels())).toEqual(
          Array.from(original.getPixels())
        );
      }
    }
  });

  it("roundtrips layer opacity", function () {
    var piskel = buildPiskel();
    piskel.getLayerAt(0).setOpacity(0);
    piskel.getLayerAt(1).setOpacity(0.7);

    var serializedPiskel = serializer.serialize(piskel);

    var deserialized = null;
    deserializer.deserialize(serializedPiskel, function (p) {
      deserialized = p;
    });

    expect(deserialized.getLayerAt(0).getOpacity()).toBe(0);
    expect(deserialized.getLayerAt(1).getOpacity()).toBe(0.7);
  });

  it("roundtrips layer names", function () {
    var piskel = buildPiskel();

    var serializedPiskel = serializer.serialize(piskel);

    var deserialized = null;
    deserializer.deserialize(serializedPiskel, function (p) {
      deserialized = p;
    });

    expect(deserialized.getLayerAt(0).getName()).toBe("layer1");
    expect(deserialized.getLayerAt(1).getName()).toBe("layer2");
  });

  it("preserves hidden frames as numeric frame indices", function () {
    var piskel = buildPiskel();
    piskel.hiddenFrames = [1];

    var serializedPiskel = serializer.serialize(piskel);

    var deserialized = null;
    deserializer.deserialize(serializedPiskel, function (p) {
      deserialized = p;
    });

    expect(deserialized.hiddenFrames).toEqual([1]);
  });

  it("preserves multiple hidden frame indices", function () {
    var piskel = buildPiskel();
    piskel.hiddenFrames = [0, 2];

    var serializedPiskel = serializer.serialize(piskel);

    var deserialized = null;
    deserializer.deserialize(serializedPiskel, function (p) {
      deserialized = p;
    });

    expect(deserialized.hiddenFrames).toEqual([0, 2]);
  });

  it("preserves an empty hidden frames list", function () {
    var piskel = buildPiskel();
    piskel.hiddenFrames = [];

    var serializedPiskel = serializer.serialize(piskel);

    var deserialized = null;
    deserializer.deserialize(serializedPiskel, function (p) {
      deserialized = p;
    });

    expect(deserialized.hiddenFrames).toEqual([]);
  });

  it("roundtrips a single frame sprite", function () {
    var descriptor = new pskl.model.piskel.Descriptor("name", "");
    var piskel = new pskl.model.Piskel(1, 1, 4, descriptor);
    piskel.addLayer(new pskl.model.Layer("layer"));
    piskel.getLayerAt(0).addFrame(
      toFrame([
        ["#336699"]
      ])
    );

    var serializedPiskel = serializer.serialize(piskel);

    var deserialized = null;
    deserializer.deserialize(serializedPiskel, function (p) {
      deserialized = p;
    });

    frameEqualsGrid(deserialized.getLayerAt(0).getFrameAt(0), [
      ["#336699"]
    ]);
    expect(deserialized.getLayers().length).toBe(1);
    expect(deserialized.getFrameCount()).toBe(1);
  });
});
