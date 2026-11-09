export type SuperGifOptions = { gif: HTMLImageElement };

export type SuperGifLoader = {
  load(options: { success: () => void; error: () => void }): void;
  getFrames(): { data: ImageData }[];
};

declare global {
  // biome-ignore lint/style/useConsistentTypeDefinitions: only an interface can augment Window
  interface Window {
    SuperGif: new (options: SuperGifOptions) => SuperGifLoader;
  }
}
