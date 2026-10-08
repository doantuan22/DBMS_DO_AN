// Offline R3.2 tooling; application runtime never imports these scripts.
import path from 'node:path';
import { root } from '../r11/common.mjs';
export * from '../r11/common.mjs';
export const evidenceRoot = path.join(root, 'docs/evidence/r32');
