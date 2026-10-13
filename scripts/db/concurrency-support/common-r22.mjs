// Offline R2.2 tooling. Backend runtime never imports this directory.
import path from 'node:path';
import { root } from './common-r11.mjs';
export * from './common-r11.mjs';
export const evidenceRoot = path.join(root, '.audit-output/concurrency/r22');
