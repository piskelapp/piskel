(function () {
  /**
   * Depending on the value of the data-iframe-loader attribute, display or store the content of the iframe
   * @param  {HTMLElement} iframe
   */
  var processFrame = function (iframe) {
    var type = iframe.getAttribute('data-iframe-loader');
    if (type === "display") {
      displayFrame(iframe);
    } else if (type === "store") {
      storeFrame(iframe);
    } else {
      console.error('iframeLoader invalid type : ' + type);
    }
  };

  /**
   * Replace the existing iframe with the content of the iframe
   * If the iframe has a single root element, it will directly replace the iframe.
   * If there are several roots, a wrapping div will be created and will replace the iframe
   * @param  {HTMLElement} iframe
   */
  var displayFrame = function (iframe) {
    var div=document.createElement("div");
    div.innerHTML = iframe.contentWindow.document.body.innerHTML;
    if (div.children.length == 1) {
      div = div.children[0];
    }
    iframe.parentNode.replaceChild(div, iframe);
  };

  /**
   * Load the iframe content as a <script type="text/html" id={iframe-src}>{iframe-content}</script>
   * The content can later be accessed by getting the script (through getElementById for instance) and reading innerHTML
   * @param  {HTMLElement} iframe
   */
  var storeFrame = function (iframe) {
    var script=document.createElement("script");
    script.setAttribute("type", "text/html");
    if (window.pskl && window.pskl.appEngineToken_) {
      script.setAttribute("id", iframe.getAttribute("src").replace('../',''));
    } else {
      script.setAttribute("id", iframe.getAttribute("src"));
    }
    script.innerHTML = iframe.contentWindow.document.body.innerHTML;
    iframe.parentNode.removeChild(iframe);
    document.body.appendChild(script);
  };

  window.iframeloader = {
    onLoad : function (event) {
      var iframe = event.target || event.srcElement;
      processFrame(iframe);
    }
  }
})();