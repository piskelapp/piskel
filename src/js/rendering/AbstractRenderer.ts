import { Constants } from "../Constants";
import type { Frame } from "../model/Frame";
import type { RenderedFrame } from "../model/frame/RenderedFrame";

export class AbstractRenderer {
  clear(): void {
    return Constants.ABSTRACT_FUNCTION();
  }

  render(frame: Frame | RenderedFrame): void {
    return Constants.ABSTRACT_FUNCTION();
  }

  getCoordinates(x: number, y: number): { x: number; y: number } {
    return Constants.ABSTRACT_FUNCTION();
  }

  setGridWidth(value: number): void {
    return Constants.ABSTRACT_FUNCTION();
  }

  getGridWidth(): number {
    return Constants.ABSTRACT_FUNCTION();
  }

  setZoom(zoom: number): void {
    return Constants.ABSTRACT_FUNCTION();
  }

  getZoom(): number {
    return Constants.ABSTRACT_FUNCTION();
  }

  setOffset(x: number, y: number): void {
    return Constants.ABSTRACT_FUNCTION();
  }

  getOffset(): { x: number; y: number } {
    return Constants.ABSTRACT_FUNCTION();
  }

  setDisplaySize(width: number, height: number): void {
    return Constants.ABSTRACT_FUNCTION();
  }

  getDisplaySize(): { width: number; height: number } {
    return Constants.ABSTRACT_FUNCTION();
  }
}
