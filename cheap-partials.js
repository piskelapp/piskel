// TODO : Move to js folder
// TODO : Put under namespace
// TODOC
window._ctl = function (event) {
  var iframe=event.target || event.srcElement, div=document.createElement("div");
  div.innerHTML = iframe.contentWindow.document.body.innerHTML;
  if (div.children.length == 1) div = div.children[0];
  iframe.parentNode.replaceChild(div, iframe);
};

window._ctp = function (event) {
  var iframe=event.target || event.srcElement, script=document.createElement("script");
  script.setAttribute("type", "text/html");
  script.setAttribute("id", iframe.getAttribute("src"));
  script.innerHTML = iframe.contentWindow.document.body.innerHTML;
  iframe.parentNode.removeChild(iframe);
  document.body.appendChild(script);
};