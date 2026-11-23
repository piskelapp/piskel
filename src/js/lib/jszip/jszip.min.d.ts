export type JSZipFileOptions = { base64?: boolean; binary?: boolean };

export type JSZipInstance = {
  file(name: string, data: string, options?: JSZipFileOptions): JSZipInstance;
  folder(name: string): JSZipInstance;
  generate(options: { type: "blob" }): Blob;
};

declare global {
  // biome-ignore lint/style/useConsistentTypeDefinitions: only an interface can augment Window
  interface Window {
    JSZip: new () => JSZipInstance;
  }
}
