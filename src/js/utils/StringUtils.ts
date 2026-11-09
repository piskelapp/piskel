export const StringUtils = {
  leftPad(
    input: string | number,
    length: number,
    pad: string | undefined
  ): string {
    const padding = new Array(length).join(pad);
    return (padding + input).slice(-length);
  },

  formatSize(width: number, height: number): string {
    return width + "\u00D7" + height;
  }
};
