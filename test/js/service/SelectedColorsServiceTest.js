
describe("SelectedColorsService test suite", function() {
  it("returns the default selected colors initially", function() {
    var service = new pskl.service.SelectedColorsService();
    
    expect(service.getPrimaryColor()).toBe(Constants.DEFAULT_PEN_COLOR);
    expect(service.getSecondaryColor()).toBe(Constants.TRANSPARENT_COLOR);
  });

  it("reacts to PRIMARY_COLOR_SELECTED event", function() {
    var service = new pskl.service.SelectedColorsService();
    service.init();

    var expectedColor = "#123456";
    $.publish(Events.PRIMARY_COLOR_SELECTED, [expectedColor]);

    expect(service.getPrimaryColor()).toBe(expectedColor);
    expect(service.getSecondaryColor()).toBe(Constants.TRANSPARENT_COLOR);
  });

  it("reacts to SECONDARY_COLOR_SELECTED event", function() {
    var service = new pskl.service.SelectedColorsService();
    service.init();
    
    var expectedColor = "#123456";
    $.publish(Events.SECONDARY_COLOR_SELECTED, [expectedColor]);

    expect(service.getPrimaryColor()).toBe(Constants.DEFAULT_PEN_COLOR);
    expect(service.getSecondaryColor()).toBe(expectedColor);
  });
});