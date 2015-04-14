describe("Color utils", function() {

  beforeEach(function() {});
  afterEach(function() {});

  it("returns a color when provided with array of colors", function() {
    // when/then
    var unusedColor = pskl.utils.ColorUtils.getUnusedColor(['#ffffff', '#feffff', '#fdffff']);
    // verify
    expect(unusedColor).toBe('#FCFFFF');

    // when/then
    unusedColor = pskl.utils.ColorUtils.getUnusedColor(['#fcffff', '#feffff', '#fdffff']);
    // verify
    expect(unusedColor).toBe('#FFFFFF');
  });

  it("returns a color for an empty array", function() {
    // when/then
    var unusedColor = pskl.utils.ColorUtils.getUnusedColor([]);
    // verify
    expect(unusedColor).toBe('#FFFFFF');

    // when/then
    unusedColor = pskl.utils.ColorUtils.getUnusedColor();
    // verify
    expect(unusedColor).toBe('#FFFFFF');
  });
});