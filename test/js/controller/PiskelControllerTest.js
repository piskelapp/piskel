describe('Piskel controller', function() {
  var piskelController;

  function setColor(color, planeIndex, layerIndex, frameIndex) {
    planeIndex = (planeIndex == null || isNaN(planeIndex)) ? 0 : planeIndex;
    layerIndex = (layerIndex == null || isNaN(layerIndex)) ? 0 : layerIndex;
    frameIndex = (frameIndex == null || isNaN(frameIndex)) ? 0 : frameIndex;
    piskelController.getPlaneAt(planeIndex).getLayerAt(layerIndex).getFrameAt(frameIndex).setPixels([[color]]);
  }

  function getColor(planeIndex, layerIndex, frameIndex) {
    planeIndex = planeIndex == null || isNaN(planeIndex) ? 0 : planeIndex;
    layerIndex = layerIndex == null || isNaN(layerIndex) ? 0 : layerIndex;
    frameIndex = frameIndex == null || isNaN(frameIndex) ? 0 : frameIndex;
    return piskelController.getPlaneAt(planeIndex).getLayerAt(layerIndex).getFrameAt(frameIndex).getPixels()[0][0];
  }

  function getCurrentColor() {
    return piskelController.getCurrentLayer().getFrameAt(0).getPixels()[0][0];
  }

  beforeEach(function () {
    var descriptor = new pskl.model.piskel.Descriptor('New Piskel', '');
    var piskel = new pskl.model.Piskel(1, 1, descriptor);

    var plane = new pskl.model.Plane('Plane 1');
    var layer = new pskl.model.Layer('Layer 1');
    var frame = new pskl.model.Frame(1, 1);

    layer.addFrame(frame);
    plane.addLayer(layer);
    piskel.addPlane(plane);
    piskelController = new pskl.controller.piskel.PiskelController(piskel);
  });

  it('keeps frame count when creating a new plane', function () {
    piskelController.addFrame();
    piskelController.createPlane();

    expect(piskelController.getPlaneAt(1).getLayerAt(0).size()).toBe(2);
  });

  it('mirrors current plane\'s content', function () {
    var color0 = 'rgba(0, 0, 0, 1)';
    var color1 = 'rgba(255, 255, 255, 1)';

    piskelController.createPlane();
    piskelController.createPlane();

    setColor(color0, 0);
    setColor(color1, 1);

    piskelController.setCurrentPlaneIndex(0);
    expect(getCurrentColor()).toBe(color0);

    piskelController.setCurrentPlaneIndex(1);
    expect(getCurrentColor()).toBe(color1);
  });

  it('mirrors frame order changes to all planes', function () {
    var color0 = 'color0';
    var color1 = 'color1';
    var color2 = 'color2';
    var color3 = 'color3';

    piskelController.createPlane();
    piskelController.createPlane();

    piskelController.addFrame();

    setColor(color0, 0, 0, 0);
    setColor(color1, 1, 0, 0);
    setColor(color2, 0, 0, 1);
    setColor(color3, 1, 0, 1);

    piskelController.moveFrame(0, 1);

    expect(getColor(0, 0, 0)).toBe(color2);
    expect(getColor(1, 0, 0)).toBe(color3);
    expect(getColor(0, 0, 1)).toBe(color0);
    expect(getColor(1, 0, 1)).toBe(color1);
  });
});
