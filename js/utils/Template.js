(function () {
  var ns = $.namespace("pskl");

  ns.utils.Template = {
    get : function (templateId) {
      var template = document.getElementById(templateId);
      if (template) {
        return template.innerHTML;
      } else {
        console.error("Could not find template for id :", templateId);
      }
    },

    createFromHTML : function (html) {
      var dummyEl = document.createElement("div");
      dummyEl.innerHTML = html;
      return dummyEl.children[0];
    },

    replace : function (template, dict) {
      for (var key in dict) {
        if (dict.hasOwnProperty(key)) {
          var value = dict[key];
          template = template.replace(new RegExp('\\{\\{'+key+'\\}\\}', 'g'), value);
        }
      }
      return template;
    }
  };
})();