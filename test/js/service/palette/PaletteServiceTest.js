describe("Palette Service", function() {
  var paletteService = null;
  var localStorage = {};

  var localStorageGlobal;


  var addPalette = function (id, name, color) {
    var palette = new pskl.model.Palette(id, name, [color]);
    paletteService.savePalette(palette);
  };

  var verifyPaletteIsStored = function (paletteId) {
    var palette = paletteService.getPaletteById(paletteId);
    expect(palette).not.toBeNull();
    return palette;
  };

  var verifyPaletteIsNotStored = function (paletteId) {
    var palette = paletteService.getPaletteById(paletteId);
    expect(palette).toBeNull();
  };

  beforeEach(function() {
    localStorage = {};

    localStorageGlobal = {
      getItem : function (key) {
        if (localStorage.hasOwnProperty(key)) {
          return localStorage[key];
        } else {
          return null;
        }
      },
      setItem : function (key, item) {
        localStorage[key] = item;
      }
    };

    paletteService = new pskl.service.palette.PaletteService();
    paletteService.localStorageGlobal = localStorageGlobal;
  });

  it("returns an empty array when no palette is stored", function() {
    spyOn(localStorageGlobal, 'getItem').and.callThrough();

    var palettes = paletteService.getPalettes();
    expect(Array.isArray(palettes)).toBe(true);
    expect(palettes.length).toBe(0);
    expect(localStorageGlobal.getItem).toHaveBeenCalled();
  });

  it("can store a palette", function() {
    // when
    spyOn(localStorageGlobal, 'setItem').and.callThrough();

    var paletteId = 'palette-id';
    var paletteName = 'palette-name';
    var paletteColor = '#001122';

    // then
    addPalette(paletteId, paletteName, paletteColor);
    var palettes = paletteService.getPalettes();

    // verify
    expect(localStorageGlobal.setItem).toHaveBeenCalled();

    expect(Array.isArray(palettes)).toBe(true);
    expect(palettes.length).toBe(1);

    var retrievedPalette = paletteService.getPaletteById(paletteId);
    expect(retrievedPalette).toBeDefined();
    expect(retrievedPalette.id).toBe(paletteId);
    expect(retrievedPalette.name).toBe(paletteName);

    var colors = retrievedPalette.getColors();
    expect(Array.isArray(colors)).toBe(true);
    expect(colors.length).toBe(1);

    var color = colors[0];
    expect(color).toBe(paletteColor);
  });

  it("updates a palette", function() {
    // when
    var paletteId = 'palette-id';
    var paletteName = 'palette-name';
    var paletteColor1 = '#001122';
    var paletteColor2 = '#334455';

    // then
    addPalette(paletteId, paletteName, paletteColor1);
    addPalette(paletteId, paletteName, paletteColor2);

    // verify
    var palettes = paletteService.getPalettes();
    expect(palettes.length).toBe(1);

    var retrievedPalette = paletteService.getPaletteById(paletteId);
    var color = retrievedPalette.get(0);
    expect(color).toBe(paletteColor2);
  });

  it("can delete a palette", function() {
    // when
    addPalette('palette-id', 'palette-name', ['#001122']);

    // then
    paletteService.deletePaletteById('palette-id');

    // verify
    var palettes = paletteService.getPalettes();
    expect(palettes.length).toBe(0);
  });

  it("attempts to delete unexisting palette without side effect", function() {
    // when
    addPalette('palette-id', 'palette-name', ['#001122']);

    // then
    var palettes = paletteService.getPalettes();
    paletteService.deletePaletteById('some-other-palette-id');

    // verify
    expect(palettes.length).toBe(1);
  });

  it("deletes the correct palette when several palettes are stored", function() {
    // when
    addPalette('palette-id-0', 'palette-name-0', ['#000000']);
    addPalette('palette-id-1', 'palette-name-1', ['#111111']);
    addPalette('palette-id-2', 'palette-name-2', ['#222222']);

    // then
    paletteService.deletePaletteById('palette-id-1');

    // verify
    var palettes = paletteService.getPalettes();
    expect(palettes.length).toBe(2);
    verifyPaletteIsStored('palette-id-0');
    verifyPaletteIsNotStored('palette-id-1');
    verifyPaletteIsStored('palette-id-2');
  });
});