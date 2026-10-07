// Offline R1.2 only. Reuse R1.1 utilities without overwriting accepted R1.1 evidence.
import path from 'node:path';
import { root } from '../r11/common.mjs';
export * from '../r11/common.mjs';
export const evidenceRoot=path.join(root,'docs/evidence/r12');
