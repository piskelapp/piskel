(function () {
  var ns = $.namespace('pskl.utils');
  var templates = {};

  ns.Template = {
    get : function (templateId) {
      if (!templates[templateId]) {
        var template = document.getElementById(templateId);
        if (template) {
          templates[templateId] = template.innerHTML;
        } else {
          console.error('Could not find template for id :', templateId);
        }
      }
      return templates[templateId];
    },

    createFromHTML : function (html) {
      var dummyEl = document.createElement('div');
      dummyEl.innerHTML = html;
      return dummyEl.children[0];
    },

    insert : function (parent, position, templateId, dict) {
      var html = pskl.utils.Template.getAndReplace(templateId, dict);
      parent.insertAdjacentHTML(position, html);
    },

    getAndReplace : function (templateId, dict) {
      var result = '';
      var tpl = pskl.utils.Template.get(templateId);
      if (tpl) {
        result = pskl.utils.Template.replace(tpl, dict);
      }
      return result;
    },

    replace : function (template, dict) {
      for (var key in dict) {
        if (dict.hasOwnProperty(key)) {
          var value = dict[key];

          // special boolean keys keys key:default
          // if the value is a boolean, use default as value
          if (key.indexOf(':') !== -1) {
            if (value === true) {
              value = key.split(':')[1];
            } else if (value === false) {
              value = '';
            }
          }
          template = template.replace(new RegExp('\\{\\{' + key + '\\}\\}', 'g'), value);
        }
      }
      return template;
    }
  };
})();
