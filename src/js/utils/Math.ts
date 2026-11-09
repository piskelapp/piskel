export const MathUtils = {
  minmax(val: number, min: number, max: number): number {
    return Math.max(Math.min(val, max), min);
  },

  /**
   * Calculate the distance between {x0, y0} and {x1, y1}
   */
  distance(x0: number, x1: number, y0: number, y1: number): number {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
  }
};
