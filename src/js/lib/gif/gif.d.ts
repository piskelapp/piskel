export type GifOptions = {
  workers: number;
  quality: number;
  width: number;
  height: number;
  preserveColors: boolean;
  repeat: number;
  transparent: number | null;
};

export type GifFrameOptions = { delay: number };

export type GifEncoder = {
  addFrame(
    image: CanvasRenderingContext2D | ImageData | HTMLCanvasElement,
    options: GifFrameOptions
  ): void;
  on(event: "progress", callback: (percentage: number) => void): void;
  on(event: "finished", callback: (blob: Blob) => void): void;
  render(): void;
};

declare global {
  // biome-ignore lint/style/useConsistentTypeDefinitions: only an interface can augment Window
  interface Window {
    GIF: new (options: GifOptions) => GifEncoder;
  }
}
