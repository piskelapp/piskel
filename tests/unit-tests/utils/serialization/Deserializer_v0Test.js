describe("Deserializer v0 test", function() {

  var black = '#000000';
  var transparent = Constants.TRANSPARENT_COLOR;
  var data = [
    [
        ["#000000", "TRANSPARENT"],
        ["TRANSPARENT", "#000000"]
    ]
  ];

  it("deserializes data serialized for model v0 correctly", function (done) {
    var deserializer = pskl.utils.serialization.Deserializer;
    deserializer.deserialize(data, function (p) {
      // Check the frame has been properly deserialized
      expect(p.getLayerAt(0).getFrames().length).toBe(1);
      var frame = p.getLayerAt(0).getFrameAt(0);
      test.testutils.frameEqualsGrid(frame, [
        [black, transparent],
        [transparent, black]
      ]);
      done();
    });
  });
});
