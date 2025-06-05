import { executeTest } from './utils';

const transformTestNames = [
  "transform.center.json",
  "transform.clone.once.json",
  "transform.clone.twice.undo.once.json",
  "transform.crop.json",
  "transform.crop.selection.json",
  "transform.flip.once.alt.json",
  "transform.flip.thrice.undo.all.redo.all.json",
  "transform.flip.twice.undo.once.json",
  "transform.rotate.alt.twice.undo.once.json",
  "transform.rotate.once.alt.json",
  "transform.rotate.twice.undo.once.json"
];

transformTestNames.forEach(executeTest);