// SUPER CHEAP TEMPLATES !    
window._ctl = function (event) {
  var iframe=event.target || event.srcElement, div=document.createElement("div");
  div.innerHTML = iframe.contentWindow.document.body.innerHTML;
  if (div.children.length == 1) div = div.children[0];
  iframe.parentNode.replaceChild(div, iframe);
};