// Offline R1.2 only. Reuse R1.1 utilities without overwriting accepted R1.1 evidence.
import path from 'node:path';
import { root } from './common-r11.mjs';
export * from './common-r11.mjs';
export const evidenceRoot = path.join(root, '.audit-output/concurrency/r12');
