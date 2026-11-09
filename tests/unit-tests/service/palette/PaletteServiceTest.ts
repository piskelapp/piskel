import { Palette } from "../../../../src/js/model/Palette";
import { PaletteService } from "../../../../src/js/service/palette/PaletteService";
import { assertDefined } from "../../../../src/js/utils/core";
import { mock } from "../../testutils/TestUtils";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Palette Service", function () {
  let paletteService: PaletteService;
  let localStorage: Record<string, string> = {};

  let localStorageGlobal: Storage;

  const addPalette = function (
    id: string,
    name: string,
    color: string | string[]
  ) {
    const palette = new Palette(id, name, mock<string[]>([color]));
    paletteService.savePalette(palette);
  };

  const verifyPaletteIsStored = function (paletteId: string) {
    const palette = paletteService.getPaletteById(paletteId);
    expect(palette).not.toBeNull();
    return palette;
  };

  const verifyPaletteIsNotStored = function (paletteId: string) {
    const palette = paletteService.getPaletteById(paletteId);
    expect(palette).toBeNull();
  };

  beforeEach(function () {
    localStorage = {};

    localStorageGlobal = mock<Storage>({
      getItem: function (key: string) {
        if (localStorage.hasOwnProperty(key)) {
          return localStorage[key];
        } else {
          return null;
        }
      },
      setItem: function (key: string, item: string) {
        localStorage[key] = item;
      }
    });

    paletteService = new PaletteService();
    paletteService.localStorageGlobal = localStorageGlobal;
  });

  it("returns an empty array when no palette is stored", function () {
    vi.spyOn(localStorageGlobal, "getItem");

    const palettes = paletteService.getPalettes();
    expect(Array.isArray(palettes)).toBe(true);
    expect(palettes.length).toBe(0);
    expect(localStorageGlobal.getItem).toHaveBeenCalled();
  });

  it("can store a palette", function () {
    // when
    vi.spyOn(localStorageGlobal, "setItem");

    const paletteId = "palette-id";
    const paletteName = "palette-name";
    const paletteColor = "#001122";

    // then
    addPalette(paletteId, paletteName, paletteColor);
    const palettes = paletteService.getPalettes();

    // verify
    expect(localStorageGlobal.setItem).toHaveBeenCalled();

    expect(Array.isArray(palettes)).toBe(true);
    expect(palettes.length).toBe(1);

    const retrievedPalette = paletteService.getPaletteById(paletteId);
    expect(retrievedPalette).toBeDefined();
    expect(assertDefined(retrievedPalette, "palette").id).toBe(paletteId);
    expect(assertDefined(retrievedPalette, "palette").name).toBe(paletteName);

    const colors = assertDefined(retrievedPalette, "palette").getColors();
    expect(Array.isArray(colors)).toBe(true);
    expect(colors.length).toBe(1);

    const color = colors[0];
    expect(color).toBe(paletteColor);
  });

  it("updates a palette", function () {
    // when
    const paletteId = "palette-id";
    const paletteName = "palette-name";
    const paletteColor1 = "#001122";
    const paletteColor2 = "#334455";

    // then
    addPalette(paletteId, paletteName, paletteColor1);
    addPalette(paletteId, paletteName, paletteColor2);

    // verify
    const palettes = paletteService.getPalettes();
    expect(palettes.length).toBe(1);

    const retrievedPalette = paletteService.getPaletteById(paletteId);
    const color = assertDefined(retrievedPalette, "palette").getColors()[0];
    expect(color).toBe(paletteColor2);
  });

  it("can delete a palette", function () {
    // when
    addPalette("palette-id", "palette-name", ["#001122"]);

    // then
    paletteService.deletePaletteById("palette-id");

    // verify
    const palettes = paletteService.getPalettes();
    expect(palettes.length).toBe(0);
  });

  it("attempts to delete unexisting palette without side effect", function () {
    // when
    addPalette("palette-id", "palette-name", ["#001122"]);

    // then
    const palettes = paletteService.getPalettes();
    paletteService.deletePaletteById("some-other-palette-id");

    // verify
    expect(palettes.length).toBe(1);
  });

  it("deletes the correct palette when several palettes are stored", function () {
    // when
    addPalette("palette-id-0", "palette-name-0", ["#000000"]);
    addPalette("palette-id-1", "palette-name-1", ["#111111"]);
    addPalette("palette-id-2", "palette-name-2", ["#222222"]);

    // then
    paletteService.deletePaletteById("palette-id-1");

    // verify
    const palettes = paletteService.getPalettes();
    expect(palettes.length).toBe(2);
    verifyPaletteIsStored("palette-id-0");
    verifyPaletteIsNotStored("palette-id-1");
    verifyPaletteIsStored("palette-id-2");
  });
});
