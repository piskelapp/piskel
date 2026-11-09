export type TemplateValue = string | number | boolean | null | undefined;
export type TemplateDict = Record<string, TemplateValue>;

const templates: Record<string, string> = {};
let dummyElement: HTMLElement | undefined;

export const Template = {
  get(templateId: string): string {
    if (!templates[templateId]) {
      const template = document.getElementById(templateId);
      if (template) {
        templates[templateId] = template.innerHTML;
      } else {
        console.error("Could not find template for id :", templateId);
      }
    }
    return templates[templateId];
  },

  getAsHTML(templateId: string): Element | undefined {
    const template = Template.get(templateId);
    if (!template) {
      return;
    }

    return Template.createFromHTML(template);
  },

  createFromHTML(html: string): Element {
    const dummyEl = Template._getDummyEl();
    dummyEl.innerHTML = html;
    const element = dummyEl.children[0];

    dummyEl.innerHTML = "";

    return element;
  },

  replace(template: string, dict: TemplateDict): string {
    for (const key in dict) {
      if (dict.hasOwnProperty(key)) {
        let value: TemplateValue = dict[key];

        // special boolean keys keys key:default
        // if the value is a boolean, use default as value
        if (key.indexOf(":") !== -1) {
          if (value === true) {
            value = key.split(":")[1];
          } else if (value === false) {
            value = "";
          }
        }

        // Sanitize all values expect if the key is surrounded by `!`
        if (!/^!.*!$/.test(key)) {
          value = Template.sanitize(value);
        }

        template = template.replace(
          new RegExp("\\{\\{" + key + "\\}\\}", "g"),
          String(value)
        );
      }
    }
    return template;
  },

  getAndReplace(templateId: string, dict: TemplateDict): string {
    let result = "";
    const tpl = Template.get(templateId);
    if (tpl) {
      result = Template.replace(tpl, dict);
    }
    return result;
  },

  /**
   * Sanitize the provided string to make it safer for using in templates.
   */
  sanitize(string: TemplateValue): string {
    const dummyEl = Template._getDummyEl();

    // Apply the unsafe string as text content and
    dummyEl.textContent =
      string === null || string === undefined ? null : String(string);
    const sanitizedString = dummyEl.innerHTML;

    dummyEl.innerHTML = "";

    return sanitizedString;
  },

  _getDummyEl(): HTMLElement {
    if (!dummyElement) {
      dummyElement = document.createElement("div");
    }
    return dummyElement;
  }
};
