// Offline R3.1 tooling; never imported by application runtime.
import path from 'node:path';
import { root } from '../r11/common.mjs';
export * from '../r11/common.mjs';
export const evidenceRoot = path.join(root, 'docs/evidence/r31');
