import { Constants } from "../../../src/js/Constants";
import { Events } from "../../../src/js/Events";
import { SelectedColorsService } from "../../../src/js/service/SelectedColorsService";
import { describe, expect, it } from "vitest";

describe("SelectedColorsService test suite", function () {
  it("returns the default selected colors initially", function () {
    const service = new SelectedColorsService();

    expect(service.getPrimaryColor()).toBe(Constants.DEFAULT_PEN_COLOR);
    expect(service.getSecondaryColor()).toBe(Constants.TRANSPARENT_COLOR);
  });

  it("reacts to PRIMARY_COLOR_SELECTED event", function () {
    const service = new SelectedColorsService();
    service.init();

    const expectedColor = "#123456";
    $.publish(Events.PRIMARY_COLOR_SELECTED, [expectedColor]);

    expect(service.getPrimaryColor()).toBe(expectedColor);
    expect(service.getSecondaryColor()).toBe(Constants.TRANSPARENT_COLOR);
  });

  it("reacts to SECONDARY_COLOR_SELECTED event", function () {
    const service = new SelectedColorsService();
    service.init();

    const expectedColor = "#123456";
    $.publish(Events.SECONDARY_COLOR_SELECTED, [expectedColor]);

    expect(service.getPrimaryColor()).toBe(Constants.DEFAULT_PEN_COLOR);
    expect(service.getSecondaryColor()).toBe(expectedColor);
  });
});
