import { Palette, type PaletteData } from "@/model/Palette";
import { mock } from "../testutils/TestUtils";
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

  it("drops colors that are not valid color strings", function () {
    // when
    const paletteObj = mock<PaletteData>({
      id: "id",
      name: "name",
      colors: [null, "#111111", "", "not a color", "#12345", 42, {}, "#ABCDEF"]
    });

    // then
    const palette = Palette.fromObject(paletteObj);

    // verify
    expect(palette.getColors()).toEqual(["#111111", "#ABCDEF"]);
  });

  it("does not share its colors array with the stored object", function () {
    // when
    const paletteObj = { id: "id", name: "name", colors: ["#000000"] };

    // then
    const palette = Palette.fromObject(paletteObj);
    palette.add("#111111");

    // verify
    expect(paletteObj.colors).toEqual(["#000000"]);
  });
});
