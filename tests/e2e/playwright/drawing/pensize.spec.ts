import { executeTest } from './utils';

const penSizeTestNames = [
  "pensize.circle.basic.json",
  "pensize.circle.undo.json",
  "pensize.eraser.basic.json",
  "pensize.pen.basic.json",
  "pensize.pen.undo.json",
  "pensize.rectangle.basic.json",
  "pensize.rectangle.undo.json",
  "pensize.stroke.basic.json",
  "pensize.stroke.undo.json"
];

penSizeTestNames.forEach(executeTest);