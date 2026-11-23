export const ColorUtils = {
  getUnusedColor(usedColors?: string[]): string | null {
    usedColors = usedColors || [];
    // create check map
    const colorMap: Record<string, boolean> = {};
    usedColors.forEach(function (color: string) {
      colorMap[color.toUpperCase()] = true;
    });

    // start with white
    const color = {
      r: 255,
      g: 255,
      b: 0
    };
    let match: string | null = null;
    while (true) {
      const hex = window.tinycolor(color).toHexString().toUpperCase();

      if (!colorMap[hex]) {
        match = hex;
        break;
      } else {
        // pick a non null component to decrease its value
        const component: "r" | "g" | "b" | 0 =
          (color.r && "r") || (color.g && "g") || (color.b && "b");
        if (component) {
          color[component] = color[component] - 1;
        } else {
          // no component available, no match found
          break;
        }
      }
    }

    return match;
  }
};
