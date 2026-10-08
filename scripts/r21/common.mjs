// Offline R2.1 evidence only; accepted R0/R1 artifacts are read-only.
import path from 'node:path';
import { root } from '../r11/common.mjs';
export * from '../r11/common.mjs';
export const evidenceRoot = path.join(root, 'docs/evidence/r21');
