# Forge Prototype Pipeline

Forge Prototype Pipeline takes feature specs and turns them into deployed React prototypes via the Anthropic API and Vercel. It is one half of Forge — the build engine for The Rental Platform (TRP) and future Anthropic products. The other half (run by Dev A) generates feature specs and logic trees from feature scopes; this project consumes those specs and ships clickable prototypes at public URLs. Phase 1 goal: prove the pipeline works end-to-end on the TRP booking and scheduling flow.

## Status

Phase 1 — Foundation. Not production-ready. Every change is a hypothesis being validated. Polish is explicitly deferred to Phase 2.

## Quick Start

Five steps from cloned repo to first deployed prototype:

1. Install Node 20. If you use nvm: `nvm install && nvm use` (reads `.nvmrc`).
2. `npm install`.
3. `cp .env.example .env` and add your Anthropic API key.
4. `vercel login` (creates the local Vercel credentials this project will use).
5. `npm run generate -- --spec=fixtures/booking_spec.md --deploy`.

After step 5 you should see a Vercel URL printed in the terminal. Open it on your phone.

## Prerequisites

You need each of the following installed and working before you can run the pipeline:

- **Node ≥ 20.** Verify with `node --version`.
- **npm ≥ 10** (ships with Node 20). Verify with `npm --version`.
- **git.** Verify with `git --version`.
- **An Anthropic API key.** Get one at https://console.anthropic.com. Verify by `echo $ANTHROPIC_API_KEY` after you add it to `.env`.
- **A Vercel account.** Sign up at https://vercel.com if you don't have one.
- **The Vercel CLI**, installed globally and authenticated. Install: `npm install -g vercel`. Verify: `vercel whoami` (should print your username, not an error).

## Installation

```bash
nvm use                          # reads .nvmrc, switches to Node 20
npm install                      # installs runtime + dev deps
cp .env.example .env             # then open .env and fill in values
vercel login                     # one-time, follow the prompts
npx playwright install chromium  # optional: only needed if you'll run smoke tests
```

What each step does:

- `nvm use` — pins your shell to the Node version this project was built against.
- `npm install` — installs the Anthropic SDK, dotenv, chalk, zod, plus tsx/typescript/vitest/playwright for dev.
- `cp .env.example .env` — creates the local secrets file (gitignored). You will edit this file next.
- `vercel login` — stores Vercel credentials locally. The `deploy` step uses these.
- `npx playwright install chromium` — downloads the headless browser used by smoke tests. Only needed if you'll run `npm run test:smoke`.

## Configuration

All configuration lives in `.env`. Each variable, what it is, and what happens if it's wrong:

| Variable | Required | Where to get it | What if it's missing/wrong |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | https://console.anthropic.com | The pipeline throws at startup. |
| `ANTHROPIC_MODEL_PRIMARY` | No (default: `claude-opus-4-7`) | Anthropic model docs | Generation runs against a non-existent model and the SDK returns a 404. |
| `ANTHROPIC_MODEL_FAST` | No (default: `claude-sonnet-4-6`) | Anthropic model docs | Same as above for fast-path calls. |
| `VERCEL_TOKEN` | No (uses `vercel login` creds if blank) | https://vercel.com/account/tokens | If both this and `vercel login` are missing, deploy fails with "not authenticated". |
| `LOG_LEVEL` | No (default: `info`) | `debug` \| `info` \| `warn` \| `error` | Unrecognized value falls back to `info`. |

## Usage

| Script | What it does | Example |
|---|---|---|
| `npm run generate` | Generate a prototype from a feature spec. | `npm run generate -- --spec=fixtures/booking_spec.md --deploy` |
| `npm run deploy` | Deploy an existing run folder's `output/` to Vercel. | `npm run deploy -- --path=runs/2026-05-04T10-00-00_booking` |
| `npm run dev` | Run the CLI with whatever args you pass. | `npm run dev -- --help` |
| `npm run build` | Type-check the project (no emit). | `npm run build` |
| `npm run typecheck` | Same as `build`; the verb your CI probably expects. | `npm run typecheck` |
| `npm run test` | Run unit tests once with Vitest. | `npm run test` |
| `npm run test:watch` | Run unit tests in watch mode. | `npm run test:watch` |
| `npm run test:smoke` | Run Playwright smoke tests against `PROTOTYPE_URL`. | `PROTOTYPE_URL=https://x.vercel.app npm run test:smoke` |
| `npm run lint` | Currently aliased to typecheck. | `npm run lint` |

A worked end-to-end example:

```bash
$ npm run generate -- --spec=fixtures/booking_spec.md --deploy
[2026-05-04T10:00:00Z] info  starting generation { spec: 'fixtures/booking_spec.md', promptVersion: 'v1' }
[2026-05-04T10:00:00Z] info  rendered prompt (12,450 tokens estimated)
[2026-05-04T10:00:00Z] info  calling Claude { model: 'claude-opus-4-7' }
[2026-05-04T10:01:40Z] info  parsed 18 files from response
[2026-05-04T10:01:40Z] info  wrote files to runs/2026-05-04T10-00-00_booking/output/
[2026-05-04T10:01:41Z] info  npm install (in output/)…
[2026-05-04T10:02:30Z] info  vercel --prod (in output/)…
[2026-05-04T10:03:10Z] info  ✓ deployed: https://booking-abc123.vercel.app
```

## Project Structure

```
forge-prototype-pipeline/
├── .env.example
├── .gitignore
├── .nvmrc
├── README.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── src/
│   ├── index.ts
│   ├── generate.ts
│   ├── deploy.ts
│   ├── parser.ts
│   ├── claude.ts
│   ├── types.ts
│   └── utils/
│       ├── logger.ts
│       └── runFolder.ts
├── prompts/
│   ├── README.md
│   ├── system_v1.md
│   ├── iteration_v1.md
│   ├── mockdata_v1.md
│   └── selfcheck_v1.md
├── context/
│   ├── README.md
│   ├── trp_bootstrap.md
│   └── react_template.md
├── fixtures/
│   ├── README.md
│   └── booking_spec.md
├── runs/
│   └── .gitkeep
├── tests/
│   ├── unit/
│   │   └── parser.test.ts
│   └── smoke/
│       └── booking.spec.ts
└── docs/
    └── .gitkeep
```

- `src/index.ts` — CLI entry point. Routes `generate` / `deploy` subcommands to handlers.
- `src/generate.ts` — Orchestrates spec → prompt → Claude → parse → write → deploy.
- `src/deploy.ts` — Wraps `npm install` + `vercel --prod` and extracts the URL.
- `src/parser.ts` — Splits Claude's text response into individual files.
- `src/claude.ts` — Thin Anthropic SDK wrapper with retries.
- `src/types.ts` — Shared types (`FeatureSpec`, `GeneratedFile`, `RunMeta`, …).
- `src/utils/logger.ts` — Tiny structured logger with chalk-colored levels.
- `src/utils/runFolder.ts` — Creates and writes into `runs/{timestamp}_{slug}/`.
- `prompts/` — Prompt library, versioned by filename suffix. The most important code in the project.
- `context/` — Static text blocks (TRP product info, React conventions) inserted into the master prompt.
- `fixtures/` — Sample feature specs used during development before Dev A's pipeline is wired up.
- `runs/` — Per-generation artifact folders (gitignored body, kept directory).
- `tests/unit/` — Vitest tests, fast and offline.
- `tests/smoke/` — Playwright tests that hit a deployed URL.
- `docs/` — Bootstrap doc, retrospectives, other long-form writing.

## How the Pipeline Works

The mental model is simple: **this project's code is an orchestration layer. The Anthropic API does the actual React generation.** The code's job is to load context, send it to Claude, parse the response into files on disk, run the build, and deploy.

The data flow:

1. **Input.** A feature spec — either a fixture from `fixtures/` or, eventually, the output of Dev A's pipeline. It's a markdown file with a known structure (summary, stakeholders, flows, edge cases, screens, open questions).
2. **Prompt assembly.** The system prompt template at `prompts/system_v1.md` is loaded. Three placeholders — `{{TRP_BOOTSTRAP_CONTEXT}}`, `{{REACT_TEMPLATE_CONVENTIONS}}`, `{{FEATURE_SPEC_MARKDOWN}}` — are filled with the contents of `context/trp_bootstrap.md`, `context/react_template.md`, and the spec file. The fully rendered prompt is saved to the run folder as `prompt.txt` so a regression can be diffed later.
3. **Generation.** The prompt is sent to the Anthropic API (defaults to Opus 4.7). Claude returns one big text response containing a `<plan>` block followed by a series of fenced ` ```file:path ` code blocks — one per file in the prototype.
4. **Parsing and write.** `src/parser.ts` splits the response on the `file:` fences, extracts the path and contents of each block, and writes them to `runs/{timestamp}_{slug}/output/`. The raw response and a `meta.json` (model, tokens, timing) are also saved.
5. **Build and deploy.** If `--deploy` was passed, the deploy step runs `npm install` and `vercel --prod` inside `output/`, captures the deployment URL, and writes it back into `meta.json`.
6. **Inspect.** Every artifact lives on disk in the run folder. When something looks wrong, you have the exact prompt, the exact response, and the exact files to diff against any prior run.

## Working with Prompts

Prompts live in `prompts/` and are the single most important code in this project. They are versioned by filename suffix (`_v1`, `_v2`, …). Rules:

- **Never edit a prompt that has been used to generate a reviewed prototype.** Create a new version (`system_v2.md`) instead. You will need to roll back when quality regresses, and you can't roll back what you overwrote.
- **Always run a regression check after a prompt change.** At minimum: `npm run test` and one full manual generate against `fixtures/booking_spec.md`. Compare the output to the prior run.
- **Commit prompt changes alone.** Don't bundle them with code changes. The git log of `prompts/` is your debugging tool — keep it readable.

## Working with Runs

The `runs/` folder holds one subfolder per generation. The folder naming convention is `{ISO_timestamp}_{slug}`, where the slug is derived from the spec filename (`booking_spec.md` → `booking`). Inside each run folder:

- `prompt.txt` — the exact, fully-rendered prompt sent to Claude.
- `response.json` — the raw API response, including content blocks and usage metadata.
- `output/` — the generated React project (this is what gets deployed).
- `meta.json` — `runId`, timestamp, model, prompt version, spec path, deployed URL (if any), build duration, token counts.

The `runs/` directory itself is kept in git (via `.gitkeep`) but its contents are gitignored. Don't delete folders by hand — once `npm run clean:runs` exists (TODO), use that. When debugging a regression, the first thing to do is **diff `prompt.txt` between a known-good run and the broken run**.

## Testing

Two test suites:

- **Unit (`npm run test`)** — Fast, no network. Currently mostly the parser. Add tests here whenever you find a parser edge case in the wild.
- **Smoke (`npm run test:smoke`)** — Playwright against a deployed URL. Exports the bare minimum: page loads, no horizontal scroll at 375px, no broken links, page is non-empty. Smoke tests are not a substitute for PM review; they catch only catastrophic failures.

Smoke tests require `PROTOTYPE_URL` to be set. The full chain after a generate looks like:

```bash
URL=$(npm run generate -- --spec=fixtures/booking_spec.md --deploy --quiet | tail -1)
PROTOTYPE_URL=$URL npm run test:smoke
```

## Verifying the Setup

After `npm install`, run these six checks:

1. `node --version` prints `v20.x` or higher.
2. `npm run typecheck` exits 0.
3. `npm run test` exits 0 (unit tests pass).
4. `cat .env | grep ANTHROPIC_API_KEY` shows your real key, not the placeholder.
5. `vercel whoami` prints your Vercel username.
6. `npm run generate -- --spec=fixtures/booking_spec.md` produces a `runs/{timestamp}_booking/` folder with `prompt.txt`, `response.json`, `output/`, and `meta.json`.

If all six pass, you're set up.

## Troubleshooting

- **"ANTHROPIC_API_KEY missing"** → check that `.env` exists in the project root and the key line is uncommented and filled in.
- **"vercel: command not found"** → `npm install -g vercel`.
- **"Cannot find module 'tsx'"** → `npm install` didn't complete; re-run it.
- **Generation produced an empty output folder** → check `prompt.txt` in the run folder. The placeholders may not have rendered (look for literal `{{FEATURE_SPEC_MARKDOWN}}`).
- **Build fails after generation** → run `npm install && npm run dev` manually inside the run's `output/` folder. The error message tells you exactly what to add to the prompt.
- **"No file blocks found in Claude response"** → the model wrapped its output in prose instead of fenced file blocks. The `<output_format>` section of `prompts/system_v1.md` needs reinforcement; consider creating `system_v2.md` with stronger output constraints.

## Companion Documents

- **The Forge System Spec** — vision, what Forge is and is not.
- **The Forge Development Roadmap** — phase plan (Phase 1 = this; Phases 2–5 add polish, atlas integration, multi-product support).
- **The Forge Phase 1 Dev Spec** — master spec covering both Dev A and Dev B's work.
- **The Forge Phase 1 Dev B Spec** — tactical guide for this project specifically. Section 7 is the canonical prompt source.
- **The retrospective doc** — will live in `docs/` after Phase 1 ships.

## Contributing

For now, just you and Dev A. Three rules:

1. **Every change to anything in `prompts/` ships as a new version file.** Never edit in place.
2. **Run unit tests before every commit.** Run smoke tests before every prompt change goes live.
3. **When you find a bug in a generated prototype, the fix is almost always in the prompt, not in the parser.** Read `response.json` first.

## License

Internal — confidential.
