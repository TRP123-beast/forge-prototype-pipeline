import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { logger } from './utils/logger.ts';

const execAsync = promisify(exec);

const NPM_INSTALL_TIMEOUT_MS = 5 * 60 * 1000;
const VERCEL_DEPLOY_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Deploy the generated React project at projectPath to Vercel and return
 * the production URL.
 *
 * TODO (Phase 4): atlas integration — hand the deployed URL to the atlas
 * service so PMs can browse all prototypes from one place.
 *
 * TODO (Phase 4): deployment notifications — Slack/email ping when a
 * generation finishes (long generations make polling awkward).
 */
export async function deploy(projectPath: string): Promise<string> {
  const absPath = resolve(projectPath);
  const pkgPath = resolve(absPath, 'package.json');

  if (!existsSync(pkgPath)) {
    throw new Error(`Cannot deploy: no package.json found at ${pkgPath}.`);
  }

  // 1. npm install in the project folder.
  logger.info('npm install', { cwd: absPath });
  try {
    await execAsync('npm install --silent', {
      cwd: absPath,
      timeout: NPM_INSTALL_TIMEOUT_MS,
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (err) {
    const e = err as { stderr?: string; stdout?: string; message?: string };
    throw new Error(
      `npm install failed in ${absPath}: ${e.message ?? 'unknown error'}\nstderr: ${e.stderr ?? ''}`,
    );
  }

  // 2. vercel --prod, capturing stdout for the URL.
  logger.info('vercel --prod', { cwd: absPath });
  const tokenFlag = process.env.VERCEL_TOKEN ? ` --token=${process.env.VERCEL_TOKEN}` : '';
  const command = `vercel --prod --yes --cwd "${absPath}"${tokenFlag}`;

  let stdout = '';
  let stderr = '';
  try {
    const result = await execAsync(command, {
      timeout: VERCEL_DEPLOY_TIMEOUT_MS,
      maxBuffer: 32 * 1024 * 1024,
    });
    stdout = result.stdout;
    stderr = result.stderr;
  } catch (err) {
    const e = err as { stderr?: string; stdout?: string; message?: string };
    throw new Error(
      `vercel deploy failed: ${e.message ?? 'unknown error'}\nstderr: ${e.stderr ?? ''}`,
    );
  }

  // 3. Extract the deployment URL — the last https:// URL printed.
  const combined = `${stdout}\n${stderr}`;
  const urlMatches = combined.match(/https:\/\/[^\s]+/g);
  if (!urlMatches || urlMatches.length === 0) {
    throw new Error(
      `Could not find a deployment URL in vercel output.\nstdout: ${stdout}\nstderr: ${stderr}`,
    );
  }

  const url = urlMatches[urlMatches.length - 1]!.replace(/[)\].,]+$/, '');
  return url;
}
