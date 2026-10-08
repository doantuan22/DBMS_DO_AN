// Offline R2.2 tooling. Backend runtime never imports this directory.
import path from 'node:path';
import { root } from '../r11/common.mjs';
export * from '../r11/common.mjs';
export const evidenceRoot = path.join(root, 'docs/evidence/r22');
