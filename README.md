# gas-sheets-vite

> Apps Script + Google Sheets web app starter with Vite, TypeScript, end-to-end typed RPC, and local dev with HMR against a mock backend.

Uses the same Sheets storage layer as [`gas-sheets-minimal`](https://github.com/lucas-rollin/gas-sheets-minimal), and adds local tooling, TypeScript contracts, and room for any frontend framework.

## File Structure

Every source file starts with an `@core` or `@app` comment.

- **Core**: template infrastructure. You rarely need to touch it.
- **App**: the starter Todo. Meant to be rewritten.
- **Config**: project settings you edit occasionally.

```text
├── types/
│   ├── core.ts      # core: DbRecord, ClientApi
│   └── app.ts       # app: Task, ServerApi
├── server/
│   ├── main.ts      # core: doGet + `export * from './api'`
│   ├── db.ts        # core: createDb() engine over a storage interface
│   └── api.ts       # app: schema + endpoint implementations
├── client/
│   ├── rpc.ts       # core: real bridge in production, mock in dev
│   ├── index.html   # app: markup
│   ├── main.ts      # app: client logic
│   ├── mock.ts      # app: mock backend for local dev
│   └── style.css    # app: styles
├── appsscript.json  # config: manifest (scopes, timezone, web app access)
└── vite.config.ts   # config: client and server bundling
```

## Quickstart

### 1. Get the code

Click **Use this template** on GitHub, or:

```bash
gh repo create my-app --template lucas-rollin/gas-sheets-vite --clone
# or, without GitHub:
npx degit lucas-rollin/gas-sheets-vite my-app
cd my-app
```

### 2. Install and log in

1. Install [Node.js](https://nodejs.org) (current LTS).
2. Enable the Apps Script API at <https://script.google.com/home/usersettings>. Without this, `clasp` fails with "User has not enabled the Apps Script API".

```bash
npm install
npm run login
```

### 3. Create or link an Apps Script project

```bash
npx clasp create --type standalone --title "My App" --rootDir dist
```

Or copy `.clasp.json.example` to `.clasp.json` and set your `scriptId` (keep `"rootDir": "dist"`).

### 4. Push and configure

```bash
npm run push
npm run open
```

1. In the editor, go to **Project Settings** (⚙️) > **Script properties** and add `SPREADSHEET_ID` with your Google Sheet ID.
2. Click **Deploy > New deployment**, choose **Web app**, set access, and deploy.

### 5. Updating after the first deploy

`npm run push` updates your code but **not** the live web app. Either use the **Test deployment** URL (ends in `/dev`), or go to **Deploy > Manage deployments** and select **New version** on the existing deployment.

## Commands

| Command             | Purpose                                                                                                                      |
| :------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`       | Local Vite dev server with HMR, using `client/mock.ts` instead of Sheets.                                                    |
| `npm run typecheck` | Runs `tsc --noEmit` across `client/`, `server/`, and `types/`.                                                               |
| `npm run build`     | Inlines the client into `dist/index.html` and bundles the server into `dist/Code.js`.                                        |
| `npm run push`      | Builds, then runs `clasp push --force`. `--force` overwrites `appsscript.json` without prompting.                            |
| `npm run deploy`    | Pushes, then creates a **new deployment with a new URL**. To update an existing one, run `clasp deploy --deploymentId <ID>`. |
| `npm run open`      | Opens the project in the Apps Script editor.                                                                                 |

## How It Works

- **Local dev:** `client/rpc.ts` routes calls to `client/mock.ts`. You can build the UI without deploying. The mock does not touch Google Sheets, so test real persistence on a deployment.
- **Build:** the client is inlined into one `index.html` by `vite-plugin-singlefile`. The server is bundled by esbuild into `dist/Code.js`, and a build hook appends the top-level function stubs Apps Script needs for `google.script.run`. The mock is excluded from production builds.
- **Types:** `server/api.ts` is checked against `ServerApi`, and the client's `ClientApi` is derived from it with every method wrapped in a `Promise`. A mismatch fails `npm run typecheck`.

## Replacing the Todo App

Replace the contents of every **App** file:

1. **`types/app.ts`**: your entities and `ServerApi`.

   ```ts
   /** @app  Starter Todo types. Replace with your own. */
   import type { DbRecord } from './core';

   export interface Item extends DbRecord {
     name: string;
   }

   export interface ServerApi {
     listItems(): Item[];
   }
   ```

2. **`server/api.ts`**: your schema and endpoints.

   ```ts
   import type { Item, ServerApi } from '../types/app';
   import { createDb } from './db';

   const db = createDb({
     items: ['id', 'name', 'createdAt', 'updatedAt'],
   });

   export function listItems(): Item[] {
     return db.list<Item>('items');
   }

   const _contract: ServerApi = { listItems };
   void _contract;
   ```

3. **`client/mock.ts`**: mock handlers for `npm run dev`.

   ```ts
   import type { Item, ServerApi } from '../types/app';

   const items: Item[] = [{ id: '1', name: 'Sample Item', createdAt: '', updatedAt: '' }];

   export const mockHandlers: ServerApi = {
     listItems: () => items,
   };
   ```

4. **`client/index.html`, `client/main.ts`, `client/style.css`**: your UI. Keep one mount element (for example `<main id="app"></main>`) and import `api` from `./rpc`.

Then `npm run push`.

## Adding Tailwind or a Framework

Vite is framework-agnostic and `vite-plugin-singlefile` inlines whatever it builds. Install the plugin (`@tailwindcss/vite`, `@vitejs/plugin-react`, and so on), register it in `vite.config.ts`, and import it from your client entry.
