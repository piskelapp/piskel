describe("PenSize test suite", function() {
  var penSizeService;
  var userSettingsBackup;
  var userSettingsPenSize;

  beforeEach(function() {
    userSettingsBackup = pskl.UserSettings;

    pskl.UserSettings = {
      PEN_SIZE : 'PEN_SIZE_TEST_KEY',
      get : function () {
        return userSettingsPenSize;
      },

      set : function (size) {
        userSettingsPenSize = size;
      }
    };

    spyOn(pskl.UserSettings, 'get').and.callThrough();
    spyOn(pskl.UserSettings, 'set').and.callThrough();
    spyOn($, 'publish').and.callThrough();


    penSizeService = new pskl.service.pensize.PenSizeService();
  });

  afterEach(function () {
    pskl.UserSettings = userSettingsBackup;
  });

  it("gets initial value from user settings", function() {
    console.log('[PenSizeService] gets initial value from user settings');
    userSettingsPenSize = 2;

    penSizeService.init();
    expect(penSizeService.getPenSize()).toBe(2);
    expect(pskl.UserSettings.get).toHaveBeenCalledWith('PEN_SIZE_TEST_KEY');
  });

  it("saves valid value to user settings", function() {
    console.log('[PenSizeService] saves valid value to user settings');
    userSettingsPenSize = 1;

    penSizeService.init();
    penSizeService.setPenSize(3);
    expect(penSizeService.getPenSize()).toBe(3);

    expect(pskl.UserSettings.set).toHaveBeenCalledWith('PEN_SIZE_TEST_KEY', 3);
    expect($.publish).toHaveBeenCalledWith(Events.PEN_SIZE_CHANGED);
  });

  it("skips invalid value (outside of [1, 4])", function() {
    console.log('[PenSizeService] skips invalid value (outside of [1, 32])');
    userSettingsPenSize = 1;

    penSizeService.init();
    // MAX_VALUE is 32
    penSizeService.setPenSize(33);
    expect(penSizeService.getPenSize()).toBe(1);
    // MIN_VALUE is 1
    penSizeService.setPenSize(0);
    expect(penSizeService.getPenSize()).toBe(1);
    // value should be a number
    penSizeService.setPenSize("test");
    expect(penSizeService.getPenSize()).toBe(1);

    // nothing set in usersettings
    expect(pskl.UserSettings.set.calls.any()).toBe(false);
    // no event fired
    expect($.publish.calls.any()).toBe(false);
  });
});
