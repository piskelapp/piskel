(function () {
  var ns = $.namespace('pskl.utils');

  ns.Dom = {
    /**
     * Check if a given HTML element is nested inside another
     * @param  {HTMLElement}  node  Element to test
     * @param  {HTMLElement}  parent Potential Ancestor for node
     * @param  {Boolean}      excludeParent set to true if the parent should be excluded from potential matches
     * @return {Boolean}      true if parent was found amongst the parentNode chain of node
     */
    isParent : function (node, parent, excludeParent) {
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

    getParentWithData : function (node, data) {
      while (node) {
        if (node.dataset && typeof node.dataset[data] !== 'undefined') {
          return node;
        }
        node = node.parentNode;
      }
      return null;
    }
  };
})();