import { executeTest } from './utils';

const penSizeTestNames = [
  "pensize.circle.basic.json",
  "pensize.circle.undo.json",
  "pensize.eraser.basic.json",
  "pensize.eraser.undo.json",
  "pensize.pen.basic.json",
  "pensize.pen.undo.json",
  "pensize.rectangle.basic.json",
  "pensize.rectangle.undo.json",
  "pensize.stroke.basic.json",
  "pensize.stroke.undo.json"
];

// const perfTestNames = [
//   "perf.512.layers.undo.json",
//   "perf.1024.pen.bucket.json"
// ]

// const casperTestNames = [
//   "pen.drawing.json",
//   "color.picker.2.json",
//   "color.picker.json",
//   "frames.fun.json",
//   "history.basic.json",
//   "layers.duplicate.json",
//   "layers.fun.json",
//   "layers.merge.json",
//   "layers.top.bottom.json",
//   "move.json",
//   "move-alllayers-allframes.json",
//   "pen.mirror.pensize.json",
//   "pen.secondary.color.json",
//   "selection.rectangular.json",
//   "squares.circles.json",
//   "stroke.json",
//   "verticalpen.drawing.json",
//   "dithering.basic.json",
//   "transform.center.json",
//   "transform.clone.once.json",
//   "transform.clone.twice.undo.once.json",
//   "transform.crop.json",
//   "transform.crop.selection.json",
//   "transform.rotate.once.alt.json",
//   "transform.rotate.twice.undo.once.json",
//   "transform.rotate.alt.twice.undo.once.json",
//   "transform.flip.once.alt.json",
//   "transform.flip.twice.undo.once.json",
//   "transform.flip.thrice.undo.all.redo.all.json",
//   "selection.lasso.json",
//   "swapcolor.twice.undo.once.json",
//   "swapcolor.alllayers.allframes.twice.undo.once.json"
// ];

// casperTestNames.forEach(executeTest);

penSizeTestNames.forEach(executeTest);