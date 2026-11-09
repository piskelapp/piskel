import { AbstractRenderer } from "./AbstractRenderer";

export class CompositeRenderer extends AbstractRenderer {
  renderers: AbstractRenderer[];

  constructor() {
    super();
    this.renderers = [];
  }

  add(renderer: AbstractRenderer): this {
    this.renderers.push(renderer);
    return this;
  }

  clear(): void {
    this.renderers.forEach(function (renderer) {
      renderer.clear();
    });
  }

  setZoom(zoom: number): void {
    this.renderers.forEach(function (renderer) {
      renderer.setZoom(zoom);
    });
  }

  getZoom(): number {
    return this.getSampleRenderer_().getZoom();
  }

  setDisplaySize(w: number, h: number): void {
    this.renderers.forEach(function (renderer) {
      renderer.setDisplaySize(w, h);
    });
  }

  getDisplaySize(): { width: number; height: number } {
    return this.getSampleRenderer_().getDisplaySize();
  }

  setOffset(x: number, y: number): void {
    this.renderers.forEach(function (renderer) {
      renderer.setOffset(x, y);
    });
  }

  getOffset(): { x: number; y: number } {
    return this.getSampleRenderer_().getOffset();
  }

  setGridWidth(b: number): void {
    this.renderers.forEach(function (renderer) {
      renderer.setGridWidth(b);
    });
  }

  getGridWidth(): number {
    return this.getSampleRenderer_().getGridWidth();
  }

  getSampleRenderer_(): AbstractRenderer {
    if (this.renderers.length > 0) {
      return this.renderers[0];
    } else {
      throw "Renderer manager is empty";
    }
  }
}
