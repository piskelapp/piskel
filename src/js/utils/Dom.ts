export const Dom = {
  /**
   * Returns the element matching the selector, which must exist. Throws an
   * error naming the selector otherwise.
   */
  getElement<T extends Element = HTMLElement>(
    selector: string,
    parent: ParentNode = document
  ): T {
    const element = parent.querySelector<T>(selector);
    if (element === null) {
      throw new Error("Missing element: " + selector);
    }
    return element;
  },

  /**
   * Check if a given HTML element is nested inside another
   * @param  {HTMLElement}  node  Element to test
   * @param  {HTMLElement}  parent Potential Ancestor for node
   * @param  {Boolean}      excludeParent set to true if the parent should be excluded from potential matches
   * @return {Boolean}      true if parent was found amongst the parentNode chain of node
   */
  isParent(
    node: Node | null,
    parent: Node | null,
    excludeParent?: boolean
  ): boolean {
    if (node && parent) {
      if (excludeParent) {
        node = node.parentNode;
      }

      while (node) {
        if (node === parent) {
          return true;
        }
        node = node.parentNode;
      }
    }
    return false;
  },

  getParentWithData(
    node: HTMLElement | null,
    dataName: string
  ): HTMLElement | null {
    while (node) {
      if (node.dataset && typeof node.dataset[dataName] !== "undefined") {
        return node;
      }
      node = node.parentNode as HTMLElement | null;
    }
    return null;
  },

  getData(node: HTMLElement, dataName: string): string | undefined {
    const parent = Dom.getParentWithData(node, dataName);
    if (parent !== null) {
      return parent.dataset[dataName];
    }
  },

  removeClass(className: string, container?: ParentNode): void {
    const root: ParentNode = container || document;
    const elements = root.querySelectorAll("." + className);
    for (let i = 0; i < elements.length; i++) {
      elements[i].classList.remove(className);
    }
  }
};
