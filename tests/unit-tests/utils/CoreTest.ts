import { colorToInt } from "../../../src/js/utils/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("Core utils tests", function () {
  beforeEach(function () {});
  afterEach(function () {});

  it("colorToInt parses red", function () {
    const RED = 4278190335;

    expect(colorToInt("red")).toBe(RED);
    expect(colorToInt("rgb(255,0,0)")).toBe(RED);
    expect(colorToInt("rgba(255,0,0,1)")).toBe(RED);
    expect(colorToInt("#FF0000")).toBe(RED);
    expect(colorToInt("#ff0000")).toBe(RED);
    expect(colorToInt("#f00")).toBe(RED);
    expect(colorToInt("#f00")).toBe(RED);
  });

  it("colorToInt parses white", function () {
    const WHITE = 4294967295;

    expect(colorToInt("white")).toBe(WHITE);
    expect(colorToInt("rgb(255,255,255)")).toBe(WHITE);
    expect(colorToInt("rgba(255,255,255,1)")).toBe(WHITE);
    expect(colorToInt("#FFFFFF")).toBe(WHITE);
    expect(colorToInt("#ffffff")).toBe(WHITE);
    expect(colorToInt("#FFF")).toBe(WHITE);
    expect(colorToInt("#fff")).toBe(WHITE);
  });

  it("colorToInt parses transparent", function () {
    const TRANSPARENT = 0;

    expect(colorToInt("transparent")).toBe(TRANSPARENT);
    expect(colorToInt("rgba(100,120,150, 0)")).toBe(TRANSPARENT);
    expect(colorToInt("rgba(255,255,255,0)")).toBe(TRANSPARENT);
  });
});
