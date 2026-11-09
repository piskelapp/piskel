import { Constants } from "../../../src/js/Constants";
import { DefaultSizeController } from "../../../src/js/controller/settings/resize/DefaultSizeController";
import { ResizeUtils } from "../../../src/js/utils/ResizeUtils";
import { UserSettings } from "../../../src/js/utils/UserSettings";
import { mock } from "../testutils/TestUtils";
import { describe, expect, it, vi } from "vitest";

describe("ResizeUtils", function () {
  const fallback = { width: 32, height: 16 };

  it("sanitizeSize keeps valid sizes", function () {
    expect(ResizeUtils.sanitizeSize(64, 48, fallback)).toEqual({
      width: 64,
      height: 48
    });
    expect(ResizeUtils.sanitizeSize("64", "48", fallback)).toEqual({
      width: 64,
      height: 48
    });
  });

  it("sanitizeSize caps sizes above the maximum", function () {
    expect(
      ResizeUtils.sanitizeSize("99999999999999", "99999999999999", fallback)
    ).toEqual({
      width: Constants.MAX_DEFAULT_WIDTH,
      height: Constants.MAX_DEFAULT_HEIGHT
    });
  });

  it("sanitizeSize uses the fallback for invalid values", function () {
    expect(ResizeUtils.sanitizeSize("", "abc", fallback)).toEqual({
      width: 32,
      height: 16
    });
    expect(ResizeUtils.sanitizeSize(0, -5, fallback)).toEqual({
      width: 32,
      height: 16
    });
    expect(
      ResizeUtils.sanitizeSize(
        mock<string>(undefined),
        mock<string>(null),
        fallback
      )
    ).toEqual({
      width: 32,
      height: 16
    });
  });

  it("getDefaultSize sanitizes the stored default size", function () {
    const get = vi.spyOn(UserSettings, "get");
    get.mockReturnValue(mock<string>({ width: 64, height: 48 }));
    expect(DefaultSizeController.getDefaultSize()).toEqual({
      width: 64,
      height: 48
    });

    get.mockReturnValue(mock<string>({ width: 1e13, height: 1e13 }));
    expect(DefaultSizeController.getDefaultSize()).toEqual({
      width: Constants.MAX_DEFAULT_WIDTH,
      height: Constants.MAX_DEFAULT_HEIGHT
    });

    get.mockReturnValue(mock<string>({ width: 0, height: "abc" }));
    expect(DefaultSizeController.getDefaultSize()).toEqual({
      width: Constants.DEFAULT.WIDTH,
      height: Constants.DEFAULT.HEIGHT
    });
  });
});
