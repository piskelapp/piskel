describe("Color utils", function() {

  beforeEach(function() {});
  afterEach(function() {});

  it("returns a color when provided with array of colors", function() {
    // when/then
    var unusedColor = pskl.utils.ColorUtils.getUnusedColor(['#ffff00', '#feff00', '#fdff00']);
    // verify
    expect(unusedColor).toBe('#FCFF00');

    // when/then
    unusedColor = pskl.utils.ColorUtils.getUnusedColor(['#fcff00', '#feff00', '#fdff00']);
    // verify
    expect(unusedColor).toBe('#FFFF00');
  });

  it("returns a color for an empty array", function() {
    // when/then
    var unusedColor = pskl.utils.ColorUtils.getUnusedColor([]);
    // verify
    expect(unusedColor).toBe('#FFFF00');

    // when/then
    unusedColor = pskl.utils.ColorUtils.getUnusedColor();
    // verify
    expect(unusedColor).toBe('#FFFF00');
  });
});