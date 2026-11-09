import { Layer } from "../../../src/js/model/Layer";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("Layer model test", function () {
  beforeEach(function () {});
  afterEach(function () {});

  it("has proper defaults", function () {
    const layer = new Layer("layerName");

    expect(layer.getOpacity()).toBe(1);
    expect(layer.getFrames().length).toBe(0);
    expect(layer.getName()).toBe("layerName");
  });

  it("can set opacity", function () {
    const layer = new Layer("layerName");

    layer.setOpacity(0.5);
    expect(layer.getOpacity()).toBe(0.5);
  });

  it("ignores bad opacity", function () {
    const layer = new Layer("layerName");

    layer.setOpacity(0.3);
    expect(layer.getOpacity()).toBe(0.3);

    layer.setOpacity("Yep I'm an opacity, let me in !");
    expect(layer.getOpacity()).toBe(0.3);

    layer.setOpacity(9000);
    expect(layer.getOpacity()).toBe(0.3);

    layer.setOpacity(-1);
    expect(layer.getOpacity()).toBe(0.3);

    layer.setOpacity(null);
    expect(layer.getOpacity()).toBe(0.3);
  });
});
