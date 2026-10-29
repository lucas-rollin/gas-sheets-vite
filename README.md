# gas-sheets-vite

The same server as [`gas-sheets-minimal`](https://github.com/lucas-rollin/gas-sheets-minimal), plus a Vite + TypeScript client with hot reload against a mock backend. Only the client is built; the `.gs` files are copied through untouched. Choose this if the UI will grow past a couple of screens or you want proper editor support for CSS and TS.

```text
server/   main.ts, db.ts                TypeScript server code (bundled into dist/Code.js)
client/   index.html, main.ts, api.ts   TypeScript client (bundled into dist/index.html)
shared/   types.ts                      Shared types and Api contract (single source of truth)
appsscript.json                         Manifest (copied to dist/)
vite.config.ts, tsconfig.json
dist/                                   Build output (what clasp pushes)
```

## Setup

```bash
npm install
npm run login
npx clasp create-script --type standalone --title "My App" --rootDir dist
#   (or copy .clasp.json.example -> .clasp.json and set scriptId)
npm run push
```
Then in the Apps Script editor: **Project Settings > Script properties** → add `SPREADSHEET_ID`, and **Deploy > New deployment > Web app**.
Sheet tabs are created automatically from `SCHEMA` in `server/db.ts`.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local client development with Vite HMR and `client/mock.ts` |
| `npm run typecheck` | `tsc --noEmit` on client, server, and shared types |
| `npm run build` | Typechecks, inlines the client HTML, and bundles the TS server into `dist/Code.js` |
| `npm run push` | Build, then `clasp push` |
| `npm run deploy` | Push, then create a deployment |
| `npm run open` | Opens the script in Google Apps Script editor |

## Adding a feature

1. **Contract**: Add your models and methods to `shared/types.ts`.
2. **Server**: Implement the function in `server/main.ts` (export it; the build automatically creates Apps Script entry stubs).
3. **Client**: Implement the call in `client/api.ts`.
4. **Mock**: Add a handler in `client/mock.ts` so `npm run dev` remains functional locally.
   *(TypeScript ensures `ServerApi` and `ClientApi` remain strictly in sync).*

## How it works

- **Local Dev (`npm run dev`)**: Vite runs the client with instant HMR. `client/api.ts` routes calls to `client/mock.ts` during dev. When building for production, the mock is tree-shaken away.
- **Single-command build (`npm run build`)**: Vite builds and inlines the client into `dist/index.html` via `vite-plugin-singlefile`. A custom build hook bundles `server/main.ts` with `esbuild` into an IIFE `dist/Code.js` and appends top-level function stubs required by Google Apps Script for `doGet` and `google.script.run`.
- **End-to-end type safety**: Client and server share types and API definitions from `shared/types.ts`.
