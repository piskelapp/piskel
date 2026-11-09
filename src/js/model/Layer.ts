import type { Frame } from "./Frame";
export class Layer {
  name: string;
  frames: Frame[];
  opacity: number;

  constructor(name: string) {
    if (!name) {
      throw "Invalid arguments in Layer constructor : 'name' is mandatory";
    } else {
      this.name = name;
      this.frames = [];
      this.opacity = 1;
    }
  }

  /**
   * Create a Layer instance from an already existing set a Frames
   * @static
   * @param  {String} name layer's name
   * @param  {Array<pskl.model.Frame>} frames should all have the same dimensions
   * @return {pskl.model.Layer}
   */
  static fromFrames(name: string, frames: Frame[]): Layer {
    const layer = new Layer(name);
    frames.forEach(layer.addFrame.bind(layer));
    return layer;
  }

  getName(): string {
    return this.name;
  }

  setName(name: string): void {
    this.name = name;
  }

  getOpacity(): number {
    return this.opacity;
  }

  setOpacity(input: number | string | null): void {
    const opacity = typeof input == "string" ? parseFloat(input) : input;
    if (opacity === null || isNaN(opacity) || opacity < 0 || opacity > 1) {
      return;
    }
    this.opacity = +opacity.toFixed(3);
  }

  isTransparent(): boolean {
    return this.opacity < 1;
  }

  getFrames(): Frame[] {
    return this.frames;
  }

  getFrameAt(index: number): Frame {
    return this.frames[index];
  }

  addFrame(frame: Frame): void {
    this.frames.push(frame);
  }

  addFrameAt(frame: Frame, index: number): void {
    this.frames.splice(index, 0, frame);
  }

  removeFrame(frame: Frame): void {
    const index = this.frames.indexOf(frame);
    this.removeFrameAt(index);
  }

  removeFrameAt(index: number): void {
    if (this.frames[index]) {
      this.frames.splice(index, 1);
    } else {
      console.error(
        "Invalid index in removeFrameAt : %s (size : %s)",
        index,
        this.size()
      );
    }
  }

  moveFrame(fromIndex: number, toIndex: number): void {
    const frame = this.frames.splice(fromIndex, 1)[0];
    this.frames.splice(toIndex, 0, frame);
  }

  swapFramesAt(fromIndex: number, toIndex: number): void {
    const fromFrame = this.frames[fromIndex];
    const toFrame = this.frames[toIndex];
    if (fromFrame && toFrame) {
      this.frames[toIndex] = fromFrame;
      this.frames[fromIndex] = toFrame;
    } else {
      console.error(
        "Frame not found in moveFrameAt (from %s, to %s)",
        fromIndex,
        toIndex
      );
    }
  }

  duplicateFrame(frame: Frame): void {
    const index = this.frames.indexOf(frame);
    this.duplicateFrameAt(index);
  }

  duplicateFrameAt(index: number): void {
    const frame = this.frames[index];
    if (frame) {
      const clone = frame.clone();
      this.addFrameAt(clone, index);
    } else {
      console.error("Frame not found in duplicateFrameAt (at %s)", index);
    }
  }

  size(): number {
    return this.frames.length;
  }

  getHash(): string {
    return this.frames
      .map(function (frame: Frame) {
        return frame.getHash();
      })
      .join("-");
  }
}
