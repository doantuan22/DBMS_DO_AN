// Offline R2.1 evidence only; accepted R0/R1 artifacts are read-only.
import path from 'node:path';
import { root } from './common-r11.mjs';
export * from './common-r11.mjs';
export const evidenceRoot = path.join(root, '.audit-output/concurrency/r21');
