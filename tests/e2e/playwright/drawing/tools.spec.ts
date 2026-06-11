import { executeTest } from './utils';

const toolsTestNames = [
    "bucket.drawing.json",
    "color.picker.2.json",
    "color.picker.json",
    "dithering.basic.json",
    "lighten.darken.json",
    "move-alllayers-allframes.json",
    "move.json",
    "pen.drawing.json",
    "pen.mirror.pensize.json",
    "pen.secondary.color.json",
    "selection.lasso.json",
    "selection.rectangular.json",
    "squares.circles.json",
    "stroke.json",
    "swapcolor.alllayers.allframes.twice.undo.once.json",
    "swapcolor.twice.undo.once.json",
    "verticalpen.drawing.json"
];

toolsTestNames.forEach(executeTest);
