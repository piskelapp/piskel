import { Template } from "./Template";

const pad = function (num: number) {
  if (num < 10) {
    return "0" + num;
  } else {
    return "" + num;
  }
};

export const DateUtils = {
  format(date: Date | number, format: string): string {
    date = new Date(date);
    return Template.replace(format, {
      Y: date.getFullYear(),
      M: pad(date.getMonth() + 1),
      D: pad(date.getDate()),
      H: pad(date.getHours()),
      m: pad(date.getMinutes()),
      s: pad(date.getSeconds())
    });
  }
};
