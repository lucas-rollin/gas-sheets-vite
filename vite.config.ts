import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { build as esbuild } from 'esbuild';
import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Bundles server/main.ts into dist/Code.js and exposes top-level functions
// required by Google Apps Script (doGet and google.script.run).
const buildGasServer = (): Plugin => ({
  name: 'build-gas-server',
  apply: 'build',
  async closeBundle() {
    const ENTRY = 'server/main.ts';
    const OUT = 'dist/Code.js';

    const source = readFileSync(ENTRY, 'utf8');
    const entryPoints = [...source.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)].map((m) => m[1]);
    if (!entryPoints.includes('doGet')) {
      throw new Error(`${ENTRY} must export doGet()`);
    }

    await esbuild({
      entryPoints: [ENTRY],
      outfile: OUT,
      bundle: true,
      format: 'iife',
      globalName: '__app',
      target: 'es2020',
      charset: 'utf8',
      legalComments: 'none',
    });

    const stubs = entryPoints
      .map((n) => `function ${n}() { return __app.${n}.apply(this, arguments); }`)
      .join('\n');
    writeFileSync(OUT, `${readFileSync(OUT, 'utf8')}\n// Global entry points (generated)\n${stubs}\n`);

    copyFileSync('appsscript.json', 'dist/appsscript.json');
  },
});

export default defineConfig({
  root: 'client',
  server: {
    watch: {
      ignored: ['**/dist/**', '**/node_modules/**'],
    },
  },
  plugins: [viteSingleFile(), buildGasServer()],
  build: { outDir: '../dist', emptyOutDir: true, cssCodeSplit: false },
});
