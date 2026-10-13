// Offline R3.1 tooling; never imported by application runtime.
import path from 'node:path';
import { root } from './common-r11.mjs';
export * from './common-r11.mjs';
export const evidenceRoot = path.join(root, '.audit-output/concurrency/r31');
