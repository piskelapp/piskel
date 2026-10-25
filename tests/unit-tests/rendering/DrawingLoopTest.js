describe("DrawingLoop test", function() {
  var drawingLoop;
  var deltas;
  var now;

  beforeEach(function() {
    now = 1000;
    spyOn(Date, 'now').and.callFake(function () {
      return now;
    });

    drawingLoop = new pskl.rendering.DrawingLoop();
    // Do not schedule the next iteration, loop_ is called manually.
    drawingLoop.requestAnimationFrame = function () {};

    deltas = [];
    drawingLoop.addCallback(function (delta) {
      deltas.push(delta);
    });
  });

  it("passes the elapsed time to callbacks", function() {
    drawingLoop.loop_();
    now = 1016;
    drawingLoop.loop_();
    expect(deltas[1]).toBe(16);
  });

  it("never passes a negative delta when the clock goes backwards", function() {
    drawingLoop.loop_();
    now = 400;
    drawingLoop.loop_();
    expect(deltas[1]).toBe(0);

    now = 416;
    drawingLoop.loop_();
    expect(deltas[2]).toBe(16);
  });
});
