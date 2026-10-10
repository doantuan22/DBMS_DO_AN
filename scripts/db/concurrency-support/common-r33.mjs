// Offline R3.2 tooling; application runtime never imports these scripts.
import path from 'node:path';
import { root } from './common-r11.mjs';
export * from './common-r11.mjs';
export const evidenceRoot = path.join(root, '.audit-output/concurrency/r33');
