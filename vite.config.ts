import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { type BuildOptions, build as esbuild } from 'esbuild';
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

		const common: BuildOptions = {
			entryPoints: [ENTRY],
			outfile: OUT,
			bundle: true,
			target: 'es2020',
			charset: 'utf8',
			legalComments: 'none',
		};

		// Discover exports. esbuild reports them only for ESM output.
		const probe = await esbuild({
			...common,
			format: 'esm',
			write: false,
			metafile: true,
		});
		const entryOutput = Object.values(probe.metafile.outputs).find((o) => o.entryPoint);
		const exportNames = entryOutput?.exports ?? [];
		if (!exportNames.includes('doGet')) {
			throw new Error(`${ENTRY} must export doGet()`);
		}

		// Real bundle for Apps Script.
		await esbuild({
			...common,
			format: 'iife',
			globalName: '__app',
		});

		const stubs = exportNames
			.map((n) => `function ${n}() { return __app.${n}.apply(this, arguments); }`)
			.join('\n');
		writeFileSync(
			OUT,
			`${readFileSync(OUT, 'utf8')}\n// Global entry points (generated)\n${stubs}\n`
		);

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
