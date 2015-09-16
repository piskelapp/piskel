
describe("SelectedColorsService test suite", function() {
  it("returns the default selected colors initially", function() {
    var service = new pskl.service.SelectedColorsService();
    
    var defaultSelectedColors = service.getColors();
    expect(defaultSelectedColors.length).toBe(2);
    expect(defaultSelectedColors[0]).toBe(Constants.DEFAULT_PEN_COLOR);
    expect(defaultSelectedColors[1]).toBe(Constants.TRANSPARENT_COLOR);
  });

  it("reacts to PRIMARY_COLOR_SELECTED event", function() {
    var service = new pskl.service.SelectedColorsService();
    service.init();

    var expectedColor = "#123456";
    $.publish(Events.PRIMARY_COLOR_SELECTED, [expectedColor]);

    var defaultSelectedColors = service.getColors();
    expect(defaultSelectedColors.length).toBe(2);
    expect(defaultSelectedColors[0]).toBe(expectedColor);
    expect(defaultSelectedColors[1]).toBe(Constants.TRANSPARENT_COLOR);
  });

  it("reacts to SECONDARY_COLOR_SELECTED event", function() {
    var service = new pskl.service.SelectedColorsService();
    service.init();
    
    var expectedColor = "#123456";
    $.publish(Events.SECONDARY_COLOR_SELECTED, [expectedColor]);

    var defaultSelectedColors = service.getColors();
    expect(defaultSelectedColors.length).toBe(2);
    expect(defaultSelectedColors[0]).toBe(Constants.DEFAULT_PEN_COLOR);
    expect(defaultSelectedColors[1]).toBe(expectedColor);
  });
});