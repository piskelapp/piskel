import { executeTest } from './utils';

const layersTestNames = [
  "layers.duplicate.json",
  "layers.fun.json",
  "layers.merge.json",
  "layers.top.bottom.json"
];

layersTestNames.forEach(executeTest);