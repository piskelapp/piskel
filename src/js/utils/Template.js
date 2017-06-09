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

    getAsHTML : function (templateId) {
      var template = ns.Template.get(templateId);
      if (!template) {
        return;
      }

      return ns.Template.createFromHTML(template);
    },

    createFromHTML : function (html) {
      var dummyEl = ns.Template._getDummyEl();
      dummyEl.innerHTML = html;
      var element = dummyEl.children[0];

      if (!pskl.utils.UserAgent.isIE11) {
        dummyEl.innerHTML = '';
      }

      return element;
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

          // Sanitize all values expect if the key is surrounded by `!`
          if (!/^!.*!$/.test(key)) {
            value = ns.Template.sanitize(value);
          }

          template = template.replace(new RegExp('\\{\\{' + key + '\\}\\}', 'g'), value);
        }
      }
      return template;
    },

    getAndReplace : function (templateId, dict) {
      var result = '';
      var tpl = pskl.utils.Template.get(templateId);
      if (tpl) {
        result = pskl.utils.Template.replace(tpl, dict);
      }
      return result;
    },

    /**
     * Sanitize the provided string to make it safer for using in templates.
     */
    sanitize : function (string) {
      var dummyEl = ns.Template._getDummyEl();

      // Apply the unsafe string as text content and
      dummyEl.textContent = string;
      var sanitizedString = dummyEl.innerHTML;

      if (!pskl.utils.UserAgent.isIE11) {
        dummyEl.innerHTML = '';
      }

      return sanitizedString;
    },

    _getDummyEl : pskl.utils.UserAgent.isIE11 ?
      // IE11 specific implementation
      function () {
        return document.createElement('div');
      } :
      // Normal, sane browsers implementation.
      function () {
        if (!ns.Template._dummyEl) {
          ns.Template._dummyEl = document.createElement('div');
        }
        return ns.Template._dummyEl;
      }
  };
})();
