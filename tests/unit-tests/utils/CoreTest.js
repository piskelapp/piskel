describe("Core utils tests", function() {

  beforeEach(function() {});
  afterEach(function() {});

  it("colorToInt parses red", function() {
    var RED = 4278190335;

    expect(pskl.utils.colorToInt("red")).toBe(RED);
    expect(pskl.utils.colorToInt("rgb(255,0,0)")).toBe(RED);
    expect(pskl.utils.colorToInt("rgba(255,0,0,1)")).toBe(RED);
    expect(pskl.utils.colorToInt("#FF0000")).toBe(RED);
    expect(pskl.utils.colorToInt("#ff0000")).toBe(RED);
    expect(pskl.utils.colorToInt("#f00")).toBe(RED);
    expect(pskl.utils.colorToInt("#f00")).toBe(RED);
  });

  it("colorToInt parses white", function() {
    var WHITE = 4294967295;

    expect(pskl.utils.colorToInt("white")).toBe(WHITE);
    expect(pskl.utils.colorToInt("rgb(255,255,255)")).toBe(WHITE);
    expect(pskl.utils.colorToInt("rgba(255,255,255,1)")).toBe(WHITE);
    expect(pskl.utils.colorToInt("#FFFFFF")).toBe(WHITE);
    expect(pskl.utils.colorToInt("#ffffff")).toBe(WHITE);
    expect(pskl.utils.colorToInt("#FFF")).toBe(WHITE);
    expect(pskl.utils.colorToInt("#fff")).toBe(WHITE);
  });

  it("colorToInt parses transparent", function() {
    var TRANSPARENT = 0;

    expect(pskl.utils.colorToInt("transparent")).toBe(TRANSPARENT);
    expect(pskl.utils.colorToInt("rgba(100,120,150, 0)")).toBe(TRANSPARENT);
    expect(pskl.utils.colorToInt("rgba(255,255,255,0)")).toBe(TRANSPARENT);
  });
});