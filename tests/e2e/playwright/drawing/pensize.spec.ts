import { executeTest } from './utils';

const penSizeTestNames = [
  "pensize.circle.basic.json",
  // "pensize.circle.undo.json", // undo shortcut is flaky
  "pensize.eraser.basic.json",
  // "pensize.eraser.undo.json", // undo shortcut is flaky
  "pensize.pen.basic.json",
  "pensize.pen.undo.json",
  "pensize.rectangle.basic.json",
  "pensize.rectangle.undo.json",
  "pensize.stroke.basic.json",
  "pensize.stroke.undo.json"
];

penSizeTestNames.forEach(executeTest);