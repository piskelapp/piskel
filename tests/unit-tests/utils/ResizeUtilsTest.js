describe("ResizeUtils", function() {

  var fallback = {width: 32, height: 16};

  it("sanitizeSize keeps valid sizes", function() {
    expect(pskl.utils.ResizeUtils.sanitizeSize(64, 48, fallback))
      .toEqual({width: 64, height: 48});
    expect(pskl.utils.ResizeUtils.sanitizeSize("64", "48", fallback))
      .toEqual({width: 64, height: 48});
  });

  it("sanitizeSize caps sizes above the maximum", function() {
    expect(pskl.utils.ResizeUtils.sanitizeSize("99999999999999", "99999999999999", fallback))
      .toEqual({width: Constants.MAX_DEFAULT_WIDTH, height: Constants.MAX_DEFAULT_HEIGHT});
  });

  it("sanitizeSize uses the fallback for invalid values", function() {
    expect(pskl.utils.ResizeUtils.sanitizeSize("", "abc", fallback))
      .toEqual({width: 32, height: 16});
    expect(pskl.utils.ResizeUtils.sanitizeSize(0, -5, fallback))
      .toEqual({width: 32, height: 16});
    expect(pskl.utils.ResizeUtils.sanitizeSize(undefined, null, fallback))
      .toEqual({width: 32, height: 16});
  });

  it("getDefaultSize sanitizes the stored default size", function() {
    var DefaultSizeController = pskl.controller.settings.resize.DefaultSizeController;

    spyOn(pskl.UserSettings, 'get').and.returnValue({width: 64, height: 48});
    expect(DefaultSizeController.getDefaultSize()).toEqual({width: 64, height: 48});

    pskl.UserSettings.get.and.returnValue({width: 1e13, height: 1e13});
    expect(DefaultSizeController.getDefaultSize())
      .toEqual({width: Constants.MAX_DEFAULT_WIDTH, height: Constants.MAX_DEFAULT_HEIGHT});

    pskl.UserSettings.get.and.returnValue({width: 0, height: "abc"});
    expect(DefaultSizeController.getDefaultSize())
      .toEqual({width: Constants.DEFAULT.WIDTH, height: Constants.DEFAULT.HEIGHT});
  });
});
