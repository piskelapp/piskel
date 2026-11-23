export abstract class AbstractRenderer {
  abstract clear(): void;

  abstract setGridWidth(value: number): void;

  abstract getGridWidth(): number;

  abstract setZoom(zoom: number): void;

  abstract getZoom(): number;

  abstract setOffset(x: number, y: number): void;

  abstract getOffset(): { x: number; y: number };

  abstract setDisplaySize(width: number, height: number): void;

  abstract getDisplaySize(): { width: number; height: number };
}
