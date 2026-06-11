import { executeTest } from './utils';

const globalTestNames = [
  "frames.fun.json",
  "history.basic.json"
];

globalTestNames.forEach(executeTest);
