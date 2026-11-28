import { Frame } from "@/model/Frame";
import { describe, expect, it } from "vitest";

describe("Frame model test", function () {
  it("creates an empty frame of the given size", function () {
    const frame = new Frame(4, 2);

    expect(frame.getWidth()).toBe(4);
    expect(frame.getHeight()).toBe(2);
  });

  it("throws an Error, with a stack, for an invalid size", function () {
    for (const [width, height] of [
      [0, 0],
      [4, 0],
      [Number.NaN, 2]
    ]) {
      expect(() => new Frame(width, height)).toThrow(Error);
    }

    let error: unknown;
    try {
      new Frame(0, 0);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe(
      "Bad arguments in pskl.model.Frame constructor : 0, 0"
    );
    expect((error as Error).stack).toBeTruthy();
  });
});
