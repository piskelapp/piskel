import { DrawingLoop } from "../../../src/js/rendering/DrawingLoop";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("DrawingLoop test", function () {
  let drawingLoop: DrawingLoop;
  let deltas: number[];
  let now: number;

  beforeEach(function () {
    now = 1000;
    vi.spyOn(Date, "now").mockImplementation(function () {
      return now;
    });

    drawingLoop = new DrawingLoop();
    // Do not schedule the next iteration, loop_ is called manually.
    drawingLoop.requestAnimationFrame = function () {
      return 0;
    };

    deltas = [];
    drawingLoop.addCallback(function (delta) {
      deltas.push(delta);
    }, undefined);
  });

  it("passes the elapsed time to callbacks", function () {
    drawingLoop.loop_();
    now = 1016;
    drawingLoop.loop_();
    expect(deltas[1]).toBe(16);
  });

  it("never passes a negative delta when the clock goes backwards", function () {
    drawingLoop.loop_();
    now = 400;
    drawingLoop.loop_();
    expect(deltas[1]).toBe(0);

    now = 416;
    drawingLoop.loop_();
    expect(deltas[2]).toBe(16);
  });
});
