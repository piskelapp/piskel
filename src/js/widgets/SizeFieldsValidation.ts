import { EventUtils } from "@/utils/Event";
import { ResizeUtils } from "@/utils/ResizeUtils";

export type SizeField = {
  input: HTMLInputElement;
  /** Shown below the field while its value is invalid. */
  error: HTMLElement;
  max: number;
};

/**
 * Check size fields as the user types. An invalid field gets a red border and
 * an error message, and the submit button stays disabled until all fields are
 * valid.
 */
export class SizeFieldsValidation {
  fields: SizeField[];
  submitButton: HTMLInputElement | HTMLButtonElement;

  constructor(
    fields: SizeField[],
    submitButton: HTMLInputElement | HTMLButtonElement
  ) {
    this.fields = fields;
    this.submitButton = submitButton;

    for (const field of fields) {
      field.error.textContent =
        "Enter a whole number from 1 to " + field.max + ".";
      EventUtils.addEventListener(field.input, "input", this.validate, this);
    }
    this.validate();
  }

  destroy(): void {
    EventUtils.removeAllEventListeners(this);
  }

  /** Update the fields and the submit button. Returns true if all fields are valid. */
  validate(): boolean {
    let allValid = true;
    for (const field of this.fields) {
      const valid = ResizeUtils.isValidSize(field.input.value, field.max);
      field.input.classList.toggle("textfield-invalid", !valid);
      field.input.setAttribute("aria-invalid", String(!valid));
      // Only describe the field with its error message while it's shown.
      if (valid) {
        field.input.removeAttribute("aria-describedby");
      } else {
        field.input.setAttribute("aria-describedby", field.error.id);
      }
      field.error.hidden = valid;
      allValid = allValid && valid;
    }
    this.submitButton.disabled = !allValid;
    return allValid;
  }
}
