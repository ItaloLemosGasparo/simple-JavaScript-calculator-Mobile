import { cp, mkdir, rm } from 'node:fs/promises';

const files = [
  'index.html',
  'style.css',
  'script.js',
  'calculator-core.mjs',
  'calculator-state.mjs',
  'history-store.mjs',
  'input-debug.mjs'
];
await rm(new URL('../www/', import.meta.url), { recursive: true, force: true });
await mkdir(new URL('../www/', import.meta.url), { recursive: true });
for (const file of files) {
  await cp(new URL(`../${file}`, import.meta.url), new URL(`../www/${file}`, import.meta.url));
}
