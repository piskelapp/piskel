/**
 * Convert a rgb(Number, Number, Number) color to hexadecimal representation
 * @param  {Number} r red value, between 0 and 255
 * @param  {Number} g green value, between 0 and 255
 * @param  {Number} b blue value, between 0 and 255
 * @return {String} hex representation of the color '#ABCDEF'
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/**
 * Convert a color component (as a Number between 0 and 255) to its string hexa representation
 * @param  {Number} c component value, between 0 and 255
 * @return {String} eg. '0A'
 */
export function componentToHex(c: number): string {
  const hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

const intHexCache: Record<string, string> = {};

export function intToHex(int: number): string {
  if (intHexCache[int]) {
    return intHexCache[int];
  }

  const hex = rgbToHex(int & 0xff, (int >> 8) & 0xff, (int >> 16) & 0xff);
  intHexCache[int] = hex;
  return hex;
}

export function normalize(value: number | null, def: number): number {
  if (typeof value === "undefined" || value === null) {
    return def;
  } else {
    return value;
  }
}

export function hashCode(str: string): number {
  let hash = 0;
  if (str.length === 0) {
    return hash;
  }

  for (let i = 0, len = str.length, chr; i < len; i++) {
    chr = str.charCodeAt(i);
    hash = hash * 31 + chr;
    hash |= 0; // Convert to 32bit integer
  }

  return hash;
}

export function copy<T>(object: T): T {
  return JSON.parse(JSON.stringify(object));
}

const entityMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;"
};

export function escapeHtml(string: string): string {
  return String(string).replace(/[&<>"'\/]/g, function (s) {
    return entityMap[s];
  });
}

const colorCache: Record<string, number> = {};

const colorCacheReverse: Record<number, string> = {};

export function colorToInt(color: string | number): number {
  if (typeof color === "number") {
    return color;
  }

  if (typeof colorCache[color] !== "undefined") {
    return colorCache[color];
  }

  const tc = window.tinycolor(color);
  if (tc && tc.ok) {
    const rgb = tc.toRgb();
    const a = Math.round(rgb.a * 255);
    let intValue = ((a << 24) >>> 0) + (rgb.b << 16) + (rgb.g << 8) + rgb.r;
    if (a === 0) {
      // assign all 'transparent' colors to 0, theoretically mapped to rgba(0,0,0,0) only
      intValue = 0;
    }
    colorCache[color] = intValue;
    colorCacheReverse[intValue] = color;
    return intValue;
  } else {
    // If tinycolor failed, determine color by using the browser
    const d = document.createElement("div");
    d.style.color = color;
    document.body.appendChild(d);

    // Color in RGB
    color = window.getComputedStyle(d).color;
    document.body.removeChild(d);

    return colorToInt(color);
  }
}

export function intToColor(input: number | string | null): string {
  if (typeof input === "string") {
    return input;
  }

  // Null is handled as 0 by the bitwise operations below.
  const intValue = input === null ? 0 : input;

  if (typeof colorCacheReverse[intValue] !== "undefined") {
    return colorCacheReverse[intValue];
  }

  const r = intValue & 0xff;
  const g = (intValue >> 8) & 0xff;
  const b = (intValue >> 16) & 0xff;
  const a = (((intValue >> 24) >>> 0) & 0xff) / 255;
  const color = "rgba(" + r + "," + g + "," + b + "," + a + ")";

  colorCache[color] = intValue;
  colorCacheReverse[intValue] = color;
  return color;
}

const reEntityMap: Record<string, RegExp> = {};

export function unescapeHtml(string: string): string {
  Object.keys(entityMap).forEach(function (key: string) {
    reEntityMap[key] = reEntityMap[key] || new RegExp(entityMap[key], "g");
    string = string.replace(reEntityMap[key], key);
  });
  return string;
}

/**
 * Returns a value that must be set at this point. Throws an error naming it
 * otherwise, so a missing value still fails.
 */
export function assertDefined<T>(value: T | null | undefined, name: string): T {
  if (value === null || value === undefined) {
    throw new Error("Expected value to be defined: " + name);
  }
  return value;
}
