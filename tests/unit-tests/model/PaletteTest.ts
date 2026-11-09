import { Palette } from "../../../src/js/model/Palette";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("Palette", function () {
  beforeEach(function () {});
  afterEach(function () {});

  it("moves colors correctly", function () {
    // when
    const colors = ["#000000", "#111111", "#222222"];
    const palette = new Palette("id", "name", colors);

    // then
    palette.move(2, 0);

    // verify
    expect(palette.get(0)).toBe("#222222");
    expect(palette.get(1)).toBe("#000000");
    expect(palette.get(2)).toBe("#111111");
  });
});
