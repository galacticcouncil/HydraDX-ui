# CLAUDE.md — Hydration UI Monorepo

## Protocol context

For Hydration protocol-level context (architecture, products, tokenomics, Omnipool mechanics), fetch the central context index via WebFetch:
`https://raw.githubusercontent.com/galacticcouncil/hydration/main/CLAUDE.md`

It lists available reference documents and their raw GitHub URLs.

For SDK-level context (trade routing, pool queries, cross-chain transfers, papi descriptors) consumed by this app, see:
`https://raw.githubusercontent.com/galacticcouncil/sdk/master/CLAUDE.md`

## Project overview

Monorepo for the [Hydration](https://hydration.net) web app and its supporting libraries. The app is a React 19 SPA built on top of [polkadot-api (papi)](https://papi.how/) and the `@galacticcouncil/*` SDK family.

**Repo:** `galacticcouncil/hydration-ui` (private)
**Toolchain:** TypeScript 5.7, Node 22.13 (`.nvmrc`), Yarn 1 workspaces
**Hosting:** Netlify (SPA fallback in `apps/main/netlify.toml`)

## Build & dev

```sh
yarn install              # Install all workspaces (auto-install-peers via .npmrc)
yarn dev                  # turbo dev — start every workspace in dev mode (persistent)
yarn dev:production       # Same, but Vite runs with -m production
yarn build                # turbo build — type-check + bundle every workspace
yarn preview              # turbo preview — serve built artifacts
yarn lint                 # turbo lint — eslint + tsc --noEmit per workspace
yarn lint:fix             # eslint --fix per workspace
```

Single workspace dev/build/lint: `yarn workspace @galacticcouncil/<name> <script>` — e.g. `yarn workspace @galacticcouncil/main dev` or `yarn workspace @galacticcouncil/ui build`.

The root `yarn i18n` task is wired through Turborepo but has no concrete implementation in any package today — translation files in `apps/main/src/i18n/locales/` are edited by hand.

Tests run on Vitest: `yarn test` from the root (Turborepo `test` task, run in CI). `packages/web3-connect` and `packages/ui` each have a `vitest.config.ts` and a `test: vitest run` script; other workspaces have no tests yet.

## Code style

- **Prettier** (defined inline in `packages/eslint-config/index.js`, run via `eslint-plugin-prettier`):
  - `semi: false` (no semicolons)
  - `trailingComma: "all"`
  - `arrowParens: "always"`
  - `printWidth: 80`, `tabWidth: 2`, no tabs
  - `jsxSingleQuote: false` (double quotes in JSX)
- **ESLint** (`@galacticcouncil/eslint-config`): extends `eslint:recommended`, `plugin:react/recommended`, `plugin:@typescript-eslint/recommended`. Notable rules:
  - `simple-import-sort/imports` + `simple-import-sort/exports` (enforced)
  - `react-hooks/rules-of-hooks` + `react-hooks/exhaustive-deps` (error)
  - `@typescript-eslint/switch-exhaustiveness-check` (error)
  - `eqeqeq: always`
  - `no-restricted-imports`: relative imports like `./foo/` or `../` are forbidden — **always use absolute imports** (`@/...` inside `apps/main`, package-name imports across workspaces).
- **TypeScript:** `strict: true`, `target: ESNext`, `module: ESNext`, `moduleResolution: Bundler`. The Vite preset additionally enables `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` (`apps/main`).

## Commit & PR conventions

Commit messages are short, lowercase, imperative, no period. Recent history (`git log --oneline`) mixes a few styles:

```
fix claiming rewards from stopped farms
basejump papi v2
Shorten relative datetime format
bump release versions 1.x
```

Conventional `scope: description` is not enforced. Match the surrounding history when editing in an existing area.

**Branches:** topic branches off `master` using prefixes seen in history — `feat/`, `fix/`, `chore/`, plus ad-hoc names (`upgrade-deps`, `base-jumper`, `upgrade-sdk-pr311`). PRs merge into `master`.

## Versioning

All workspaces are `"private": true` and pinned at `0.0.0` — nothing in this monorepo is published to npm. The deployed artifact is the built `apps/main` bundle served from Netlify. There is no Changesets / SemVer flow here (unlike the `sdk` repo). External `@galacticcouncil/*` SDK dependencies are versioned in the root `package.json`.

## Project structure

```
apps/
  main/                  # The Hydration web app — React 19 + Vite + TanStack Router
    src/
      api/               # papi/SDK query layer (assets, omnipool, xcm, evm, …)
      components/        # App-level shared components (asset selectors, logos, …)
      modules/           # Feature modules: trade, liquidity, wallet, xcm, borrow, staking, stats, transactions, submit-transaction, layout
      routes/            # File-based TanStack Router routes (codegen → routeTree.gen.ts)
      states/            # Zustand stores (account, assetRegistry, transactions, …)
      providers/         # React providers (rpc, assets, multisig)
      hooks/             # App-wide hooks (papi, observable, table url-state, …)
      i18n/              # i18next instance + en/*.json locale files
      config/            # SEO, env, runtime config
      utils/             # App utilities (formatting, validators, indexedDB, …)
      workers/           # Web Workers (loaded via comlink)

packages/
  ui/                    # Component library + design tokens (Emotion + Radix UI). Storybook lives here.
  utils/                 # Cross-package TS utilities (helpers, hooks, constants, lib)
  web3-connect/          # Wallet connectors: Substrate, EVM (Reown AppKit), Solana, Sui
  money-market/          # Aave SDK integration (borrow/lending UI logic)
  indexer/               # GraphQL clients + codegen for indexer / squid / multix
  eslint-config/         # Shared ESLint + inline Prettier rules
  typescript-config/     # Shared tsconfig (base.json, vite.json)
```

### Dependency graph (build order)

```
Level 0 (no internal deps):  utils, indexer, eslint-config, typescript-config
Level 1:                      ui          → utils
Level 2:                      web3-connect → ui, utils, indexer
Level 3:                      money-market → ui, utils, web3-connect
Level 4:                      apps/main   → ui, utils, web3-connect, money-market, indexer
```

Turborepo (`turbo.json`) handles ordering via `dependsOn: ["^build"]`. Within a workspace, build means `tsc --build` (libraries) or `vite build && tsc` (app). The `ui` package additionally runs `yarn theme` (style-dictionary) and Storybook build.

## Key patterns

- **App is the only consumer.** `apps/main` is the single deployment target. Everything in `packages/` exists to serve it. There is no published npm output.
- **`@galacticcouncil/ui` exports source TS, not built artifacts.** Its `package.json` `exports` map points at `./src/*/index.ts`. Vite bundles each consumer fresh — no compiled `dist/` is shipped between workspaces. Same goes for `utils`, `web3-connect`, `money-market`, `indexer` (all use `main: ./src/index.ts` or an `exports` map into `src/`).
- **Custom JSX runtime.** `apps/main` and `packages/ui` set `jsxImportSource: "@galacticcouncil/ui/jsx"` (Vite + tsconfig). Component files do not need to import `React` for JSX, but do need to consume props through that runtime.
- **Emotion via Babel.** `apps/main/vite.config.ts` adds `@emotion/babel-plugin` so `css` and `sx` props work; `react/no-unknown-property` is configured to ignore them.
- **Path alias `@/*` → `apps/main/src/*`.** Enforced by `tsconfig.json` `paths` and `vite-tsconfig-paths`. Combined with the `no-restricted-imports` rule, this is the only way to do non-package-relative imports inside the app.
- **TanStack Router file-based routes.** Routes live in `apps/main/src/routes/`. The plugin generates `routeTree.gen.ts` (gitignored via `*.gen.*`) at dev/build time; never edit it by hand.
- **Design tokens are generated.** `packages/ui/style-dictionary/build.mjs` consumes `tokens/` and emits theme files. Re-run `yarn workspace @galacticcouncil/ui theme` after editing tokens.
- **GraphQL clients are generated.** `packages/indexer` exposes `codegen:indexer`, `codegen:squid`, `codegen:multix` scripts (graphql-codegen). Edit `*.graphql` queries, then re-run codegen.
- **WASM in the browser.** `vite-plugin-wasm` is enabled in both `apps/main` and `packages/ui` to load the SDK math binaries (from `@galacticcouncil/sdk-next`).
- **Yarn resolutions are load-bearing.** Root `package.json` pins `polkadot-api: ^2.1.0` and `strip-ansi: 6.0.1` across the tree; `apps/main` pins ESLint/Prettier. Don't relax these without checking what they were added to fix.

## Testing

Vitest covers pure logic only (`packages/web3-connect`, `packages/ui`); there is no component or e2e suite, so UI changes must still be verified manually:

- **Storybook** for `packages/ui` components: `yarn workspace @galacticcouncil/ui dev` (port 6006).
- **App** for end-to-end behavior: `yarn workspace @galacticcouncil/main dev` and exercise the affected flow in a browser.
- Type checks (`tsc --noEmit`) and ESLint run as part of `yarn lint` and CI — they catch correctness, not feature behavior.

## Dependencies

| Concern              | Tool                                                  |
|----------------------|-------------------------------------------------------|
| Package manager      | Yarn 1.22.22 (workspaces)                             |
| Monorepo runner      | Turborepo 2.9                                         |
| Language             | TypeScript 5.7 (strict)                               |
| App framework        | React 19 + Vite 7                                     |
| Routing              | @tanstack/react-router (file-based, code-split)       |
| Data fetching        | @tanstack/react-query                                 |
| Styling              | Emotion (`@emotion/react` + `@emotion/styled`) + Theme UI core, custom JSX runtime from `@galacticcouncil/ui/jsx` |
| Component primitives | Radix UI                                              |
| Design tokens        | style-dictionary + `@tokens-studio/sd-transforms`     |
| Component dev        | Storybook 10 (in `packages/ui`)                       |
| State                | Zustand, Immer, react-hook-form (+ zod)               |
| i18n                 | i18next + react-i18next                               |
| Substrate            | polkadot-api 2.x, `@galacticcouncil/sdk-next`, `@galacticcouncil/xc*` |
| EVM                  | viem 2.x, ethers 5.7 (Aave only), Reown AppKit        |
| Other chains         | `@solana/web3.js`, `@mysten/wallet-standard`          |
| Lending              | `@aave/contract-helpers`, `@aave/math-utils`          |
| GraphQL              | graphql-request + graphql-codegen                     |
| Linting              | ESLint 8.57 + Prettier 3.3 (via `eslint-plugin-prettier`) |
| CI                   | GitHub Actions                                        |

## CI checks

`.github/workflows/ci.yml` runs on every push:

```
yarn install --frozen-lockfile
yarn run build
yarn run lint
```

Node version on CI is `20.x` even though `.nvmrc` pins `22.13.1` locally — keep both happy when changing build scripts. There is no test job.

Deployments to Netlify are configured outside this repo (Netlify project settings) and triggered on master merges.

## Key files

| File                                        | Purpose                                                           |
|---------------------------------------------|-------------------------------------------------------------------|
| `package.json` (root)                       | Workspaces list, root deps, version resolutions                   |
| `turbo.json`                                | Task orchestration + cache config (build outputs `build/**`)      |
| `.nvmrc`                                    | Pinned Node version (22.13.1)                                     |
| `.npmrc`                                    | `auto-install-peers = true`                                       |
| `apps/main/vite.config.ts`                  | Vite plugins, manual chunk splitting, head injection              |
| `apps/main/tsconfig.json`                   | App tsconfig — references all packages, defines `@/*` alias       |
| `apps/main/netlify.toml`                    | SPA fallback (`/* → /index.html`)                                 |
| `apps/main/src/routeTree.gen.ts`            | **Generated** — never edit by hand                                |
| `packages/eslint-config/index.js`           | Shared ESLint + inline Prettier config                            |
| `packages/typescript-config/{base,vite}.json` | Shared tsconfig presets                                          |
| `packages/ui/style-dictionary/build.mjs`    | Design-token build script                                         |
| `packages/indexer/src/*/codegen.ts`         | graphql-codegen entrypoints per backend                           |

## AI agent guidance

### Before editing any file

1. **Identify the workspace** the file belongs to and read its `package.json` for scripts and dependencies.
2. **Check the workspace tsconfig** — `apps/main` enables `noUncheckedIndexedAccess` (others do not). Lint rules don't differ per package, but TS strictness does.
3. **Use absolute imports.** Inside `apps/main` use `@/...`. Across workspaces use the package name (`@galacticcouncil/ui/Button`, `@galacticcouncil/utils`). The lint rule will fail any `./foo/` or `../` import.
4. **Sort imports.** `simple-import-sort` is enforced; `yarn lint:fix` will reorder them for you.

### Tracing code across packages

- App entry: `apps/main/src/index.tsx` → `App.tsx` → routes via `routeTree.gen.ts` → `apps/main/src/routes/`.
- Routes pull data from `apps/main/src/api/*` (papi + SDK adapters) and feature logic from `apps/main/src/modules/<feature>/`.
- Reusable visuals come from `@galacticcouncil/ui` (`packages/ui/src/components/`); reusable behavior from `@galacticcouncil/utils`.
- Wallet flows: `@galacticcouncil/web3-connect` → consumed by `apps/main/src/modules/wallet/` and `submit-transaction/`.
- Lending flows: `@galacticcouncil/money-market` → consumed by `apps/main/src/modules/borrow/` (and `api/borrow/`, `api/aave.ts`).
- GraphQL data: `@galacticcouncil/indexer` exports per-backend clients (`/indexer`, `/squid`, `/multix`); the app consumes them via `apps/main/src/api/`.
- Cross-chain: external `@galacticcouncil/xc*` SDK + the app's `apps/main/src/modules/xcm/`.

### Validating changes

1. `yarn lint` from root — runs eslint + `tsc --noEmit` on every workspace. This is the closest thing to a test suite here.
2. `yarn build` from root — confirms the full Turborepo graph still type-checks and bundles.
3. **Run the app in a browser.** Type checks don't catch runtime/UI regressions; this repo has no automated UI tests, so manual verification of the affected flow is the bar.
4. For component-only changes, run Storybook (`yarn workspace @galacticcouncil/ui dev`).

### What NOT to break

- **Do not edit `*.gen.*` files** — `routeTree.gen.ts` and graphql-codegen output are regenerated. Edit the inputs (`apps/main/src/routes/*.tsx`, `*.graphql` queries) and let the generators run.
- **Do not bypass the absolute-imports rule.** The `no-restricted-imports` rule is intentional and uniform across the tree.
- **Do not introduce `React` imports for JSX.** The custom JSX runtime (`@galacticcouncil/ui/jsx`) handles this; explicit `import React` will not error but is unnecessary noise.
- **Do not edit `style-dictionary` outputs directly.** Modify `packages/ui/style-dictionary/tokens/` and re-run `yarn theme`.
- **Do not change shared resolutions casually.** The root `resolutions` block (`polkadot-api`, `strip-ansi`) and `apps/main`'s own resolutions exist to deduplicate transitive deps — bumping them can cascade.
- **Do not remove `private: true` / `0.0.0` from any workspace** — this repo does not publish to npm; making a package "publishable" by accident is a footgun.
- **Keep CI Node and `.nvmrc` in sync.** CI uses Node 20; local pin is Node 22. If you adopt syntax/APIs that need Node 22, bump CI in the same PR.
- **Do not commit `build/`, `.turbo/`, `*.gen.*`, or `storybook-static/`** — all gitignored.
