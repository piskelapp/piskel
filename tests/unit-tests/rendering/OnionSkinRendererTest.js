describe("Onion Skin Renderer test", function() {
  var BLACK = '#000000';
  var WHITE = '#ffffff';
  var TRANS = Constants.TRANSPARENT_COLOR;

  beforeEach(function() {});
  afterEach(function() {});

  it("renders correctly :)", function() {
    var fakeRenderer = createMockRenderer();
    var layer = createMockLayer();
    var piskelController = createMockPiskelController();
    piskelController.currentLayer_ = layer;

    var onionSkinRenderer = new pskl.rendering.OnionSkinRenderer(fakeRenderer, piskelController);
    // create frame
    var previousFrame = pskl.model.Frame.fromPixelGrid(test.testutils.toFrameGrid([
      [BLACK, TRANS],
      [TRANS, TRANS]
    ]));

    var nextFrame = pskl.model.Frame.fromPixelGrid(test.testutils.toFrameGrid([
      [TRANS, TRANS],
      [TRANS, BLACK]
    ]));

    piskelController.currentFrameIndex_ = 1;
    layer.frames = [previousFrame, {}, nextFrame];

    // initial state, all counters at 0
    expect(fakeRenderer.clearCounter_).toBe(0);
    expect(fakeRenderer.renderCounter_).toBe(0);

    // First rendering, should call clear + render
    onionSkinRenderer.render();
    expect(fakeRenderer.clearCounter_).toBe(1);
    expect(fakeRenderer.renderCounter_).toBe(1);
    test.testutils.frameEqualsGrid(fakeRenderer.renderedFrame_, [
      [BLACK, TRANS],
      [TRANS, BLACK]
    ]);

    // Second rendering, nothing changed, should not clear or render
    onionSkinRenderer.render();
    expect(fakeRenderer.clearCounter_).toBe(1);
    expect(fakeRenderer.renderCounter_).toBe(1);

    // remove one frame
    layer.frames = [previousFrame, {}];
    onionSkinRenderer.render();
    expect(fakeRenderer.clearCounter_).toBe(2);
    expect(fakeRenderer.renderCounter_).toBe(2);
    test.testutils.frameEqualsGrid(fakeRenderer.renderedFrame_, [
      [BLACK, TRANS],
      [TRANS, TRANS]
    ]);

    // remove the other frame
    layer.frames = [{}];
    piskelController.currentFrameIndex_ = 0;
    onionSkinRenderer.render();
    // nothing to render, but the underlying renderer should still be cleared
    expect(fakeRenderer.clearCounter_).toBe(3);
    expect(fakeRenderer.renderCounter_).toBe(2);
  });

  var createMockLayer = function () {
    return {
      frames : [],
      getFrameAt : function (index) {
        return this.frames[index];
      }
    };
  };

  var createMockPiskelController = function () {
    return {
      currentFrameIndex_ : 1,
      currentLayer_ : null,
      getLayers : function () {
        return [this.currentLayer_];
      },

      getCurrentFrameIndex : function () {
        return this.currentFrameIndex_;
      },

      getCurrentLayer : function () {
        return this.currentLayer_;
      }
    };
  };

  var createMockRenderer = function () {
    return {
      clearCounter_ : 0,
      clear : function () {
        this.clearCounter_++;
      },
      renderedFrame_ : null,
      renderCounter_ : 0,
      render : function (frame) {
        this.renderCounter_++;
        this.renderedFrame_ = frame;
      },
      getZoom : function () {
        return 1;
      },
      getGridWidth : function () {
        return 0;
      },
      getOffset : function () {
        return {x:0,y:0};
      },
      getDisplaySize : function () {
        return {width:10,height:10};
      }
    };
  };
});