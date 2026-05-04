# Prompts

These are the heart of the pipeline. Treat them like production code.

## Versioning

Prompts are versioned by filename suffix: `system_v1.md`, `system_v2.md`, and so on. The rules:

- A version is **published** the first time it is used to generate a prototype that a human reviews. After that, it is frozen.
- Never edit a published version. Create a new version file (`_v2`, `_v3`, …) and select it via `--prompt-version=v2`.
- The reason: you will need to roll back when quality regresses, and you cannot roll back something you overwrote.

## Why this matters

Generation quality is volatile. A prompt change that looks like a clear win on one feature spec can degrade output on another. Versioning is how we keep the ability to A/B prompts against the same fixture and bisect when something breaks.

## The prompts

- **`system_v1.md`** — the master spec-to-prototype generation prompt. Loaded by `src/generate.ts` and merged with the feature spec + context to produce a complete React project in one shot.
- **`iteration_v1.md`** — applies a feedback set against an existing prototype to produce an iterated version. Placeholder; fill in before first iteration run.
- **`mockdata_v1.md`** — generates realistic mock data when the feature spec leaves data shape underspecified. Placeholder.
- **`selfcheck_v1.md`** — has Claude self-review a generated prototype against the spec before deployment. Placeholder.

## Source of truth

The canonical text for each prompt lives in **the Dev B spec, Section 7**. When you fill in a placeholder, paste from there verbatim — do not paraphrase from memory.
