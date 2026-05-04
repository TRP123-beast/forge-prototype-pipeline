import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { GeneratedFile, RunMeta } from '../types.ts';

const RUNS_ROOT = resolve(process.cwd(), 'runs');

export interface RunFolder {
  runId: string;
  path: string;
}

/**
 * Create runs/{ISO_timestamp}_{slug}/ and return the absolute path.
 * Timestamp is sanitized so the folder is safe on every filesystem
 * (colons replaced with hyphens).
 */
export function createRunFolder(slug: string): RunFolder {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'run';
  const runId = `${timestamp}_${safeSlug}`;
  const path = join(RUNS_ROOT, runId);
  mkdirSync(path, { recursive: true });
  return { runId, path };
}

export function saveRunArtifact(runPath: string, filename: string, contents: string): void {
  mkdirSync(runPath, { recursive: true });
  writeFileSync(join(runPath, filename), contents, 'utf-8');
}

export function writeRunMeta(runPath: string, meta: RunMeta): void {
  saveRunArtifact(runPath, 'meta.json', JSON.stringify(meta, null, 2) + '\n');
}

export function writeGeneratedFiles(runPath: string, files: GeneratedFile[]): void {
  const outputRoot = join(runPath, 'output');
  for (const file of files) {
    const target = join(outputRoot, file.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.contents, 'utf-8');
  }
}
