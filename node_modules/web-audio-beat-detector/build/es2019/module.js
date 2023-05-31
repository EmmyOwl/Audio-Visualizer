import { load } from 'web-audio-beat-detector-broker';
import { createLoadOrReturnBroker } from './factories/load-or-return-broker';
import { worker } from './worker/worker';
const loadOrReturnBroker = createLoadOrReturnBroker(load, worker);
export const analyze = (...args) => loadOrReturnBroker().analyze(...args);
export const guess = (...args) => loadOrReturnBroker().guess(...args);
//# sourceMappingURL=module.js.map