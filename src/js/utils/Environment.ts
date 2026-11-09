/**
 *  detection method from:
 *  http://videlais.com/2014/08/23/lessons-learned-from-detecting-node-webkit/
 */

export const Environment = {
  detectNodeWebkit(): boolean {
    const isNode =
      typeof window.process !== "undefined" &&
      typeof window.require !== "undefined";
    let isNodeWebkit = false;
    if (isNode) {
      try {
        isNodeWebkit = typeof window.require("nw.gui") !== "undefined";
      } catch {
        isNodeWebkit = false;
      }
    }
    return isNodeWebkit;
  },

  isIntegrationTest(): boolean {
    return window.location.href.indexOf("integration-test") !== -1;
  },

  isHttps(): boolean {
    return window.location.href.indexOf("https://") === 0;
  }
};
