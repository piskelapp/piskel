describe("Serialization/Deserialization test", function() {

  beforeEach(function() {
    pskl.app.piskelController = {
      getFPS: function () {
        return 1;
      }
    };
  });
  afterEach(function() {
    delete pskl.app.piskelController;
  });

  it("serializes layer opacity", function(done) {
    var descriptor = new pskl.model.piskel.Descriptor('piskelName', 'piskelDesc');
    var piskel = new pskl.model.Piskel(1, 1, descriptor);

    piskel.addLayer(new pskl.model.Layer('layer1'));
    piskel.addLayer(new pskl.model.Layer('layer2'));
    piskel.addLayer(new pskl.model.Layer('layer3'));

    piskel.getLayerAt(0).setOpacity(0);
    piskel.getLayerAt(1).setOpacity(0.3);
    piskel.getLayerAt(2).setOpacity(0.9);

    var frame = new pskl.model.Frame(1, 1);
    piskel.getLayers().forEach(function (layer) {
      layer.addFrame(frame);
    });

    var serializedPiskel = pskl.utils.Serializer.serializePiskel(piskel);

    var deserializer = pskl.utils.serialization.Deserializer;
    deserializer.deserialize(JSON.parse(serializedPiskel), function (p) {
      expect(p.getLayerAt(0).getOpacity()).toBe(0);
      expect(p.getLayerAt(1).getOpacity()).toBe(0.3);
      expect(p.getLayerAt(2).getOpacity()).toBe(0.9);
      done();
    })
  });
});