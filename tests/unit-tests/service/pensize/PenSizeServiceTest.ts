import { Events } from "../../../../src/js/Events";
import { app } from "../../../../src/js/app";
import type { ShortcutService } from "../../../../src/js/service/keyboard/ShortcutService";
import { PenSizeService } from "../../../../src/js/service/pensize/PenSizeService";
import { UserSettings } from "../../../../src/js/utils/UserSettings";
import { mock } from "../../testutils/TestUtils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("PenSize test suite", function () {
  let penSizeService: PenSizeService;
  let userSettingsPenSize: string | number | undefined;

  beforeEach(function () {
    Reflect.set(UserSettings, "PEN_SIZE", "PEN_SIZE_TEST_KEY");
    vi.spyOn(UserSettings, "get").mockImplementation(function () {
      return mock<string | undefined>(userSettingsPenSize);
    });
    vi.spyOn(UserSettings, "set").mockImplementation(function (size) {
      userSettingsPenSize = size;
    });
    vi.spyOn($, "publish");

    app.shortcutService = mock<ShortcutService>({ registerShortcut() {} });
    penSizeService = new PenSizeService();
  });

  afterEach(function () {
    Reflect.set(UserSettings, "PEN_SIZE", "PEN_SIZE");
  });

  it("gets initial value from user settings", function () {
    console.log("[PenSizeService] gets initial value from user settings");
    userSettingsPenSize = 2;

    penSizeService.init();
    expect(penSizeService.getPenSize()).toBe(2);
    expect(UserSettings.get).toHaveBeenCalledWith("PEN_SIZE_TEST_KEY");
  });

  it("saves valid value to user settings", function () {
    console.log("[PenSizeService] saves valid value to user settings");
    userSettingsPenSize = 1;

    penSizeService.init();
    penSizeService.setPenSize(3);
    expect(penSizeService.getPenSize()).toBe(3);

    expect(UserSettings.set).toHaveBeenCalledWith("PEN_SIZE_TEST_KEY", 3);
    expect($.publish).toHaveBeenCalledWith(Events.PEN_SIZE_CHANGED);
  });

  it("skips invalid value (outside of [1, 4])", function () {
    console.log("[PenSizeService] skips invalid value (outside of [1, 32])");
    userSettingsPenSize = 1;

    penSizeService.init();
    // MAX_VALUE is 32
    penSizeService.setPenSize(33);
    expect(penSizeService.getPenSize()).toBe(1);
    // MIN_VALUE is 1
    penSizeService.setPenSize(0);
    expect(penSizeService.getPenSize()).toBe(1);
    // value should be a number
    penSizeService.setPenSize(mock<number>("test"));
    expect(penSizeService.getPenSize()).toBe(1);

    // nothing set in usersettings
    expect(vi.mocked(UserSettings.set).mock.calls.length > 0).toBe(false);
    // no event fired
    expect(vi.mocked($.publish).mock.calls.length > 0).toBe(false);
  });
});
