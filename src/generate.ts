import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { callClaude } from './claude.ts';
import { parseGeneratedFiles } from './parser.ts';
import type { RunMeta } from './types.ts';
import { logger } from './utils/logger.ts';
import {
  createRunFolder,
  saveRunArtifact,
  writeGeneratedFiles,
  writeRunMeta,
} from './utils/runFolder.ts';

export interface GenerateArgs {
  specPath: string;
  deploy: boolean;
  model?: string;
  promptVersion?: string;
}

export interface GenerateResult {
  runPath: string;
  deployedUrl?: string;
}

const PROMPTS_DIR = resolve(process.cwd(), 'prompts');
const CONTEXT_DIR = resolve(process.cwd(), 'context');

function slugifySpec(specPath: string): string {
  const base = basename(specPath).replace(/\.[^.]+$/, '');
  return base.replace(/_spec$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

export async function generate(args: GenerateArgs): Promise<GenerateResult> {
  const promptVersion = args.promptVersion ?? 'v1';
  const model = args.model ?? process.env.ANTHROPIC_MODEL_PRIMARY ?? 'claude-opus-4-7';

  logger.info('starting generation', {
    spec: args.specPath,
    promptVersion,
    deploy: args.deploy,
    model,
  });

  const startedAt = Date.now();

  try {
    // 1. Load the feature spec.
    const featureSpec = readFileSync(resolve(process.cwd(), args.specPath), 'utf-8');

    // 2. Load the system prompt for the requested version.
    const systemTemplatePath = resolve(PROMPTS_DIR, `system_${promptVersion}.md`);
    const systemTemplate = readFileSync(systemTemplatePath, 'utf-8');

    // 3. Load context blocks.
    const trpBootstrap = readFileSync(resolve(CONTEXT_DIR, 'trp_bootstrap.md'), 'utf-8');
    const reactTemplate = readFileSync(resolve(CONTEXT_DIR, 'react_template.md'), 'utf-8');

    // 4. Substitute placeholders.
    const systemPrompt = systemTemplate
      .replaceAll('{{TRP_BOOTSTRAP_CONTEXT}}', trpBootstrap)
      .replaceAll('{{REACT_TEMPLATE_CONVENTIONS}}', reactTemplate)
      .replaceAll('{{FEATURE_SPEC_MARKDOWN}}', featureSpec);

    // 5. Create run folder.
    const slug = slugifySpec(args.specPath);
    const { runId, path: runPath } = createRunFolder(slug);
    logger.info('created run folder', { runId, runPath });

    // 6. Save the rendered prompt for debugging.
    saveRunArtifact(runPath, 'prompt.txt', systemPrompt);

    // 7. Call Claude.
    logger.info('calling Claude', { model });
    const userMessage = 'Generate the prototype now, following the system instructions exactly.';
    const result = await callClaude({
      system: systemPrompt,
      user: userMessage,
      model,
    });

    // 8. Save the raw response.
    saveRunArtifact(
      runPath,
      'response.json',
      JSON.stringify(
        {
          model: result.model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          text: result.text,
        },
        null,
        2,
      ) + '\n',
    );

    // 9. Parse the response into files.
    const files = parseGeneratedFiles(result.text);
    logger.info('parsed files from response', { count: files.length });

    // 10. Write the generated files under runPath/output/.
    writeGeneratedFiles(runPath, files);
    logger.info('wrote generated files', { runPath });

    // 11. Build & write meta.
    const meta: RunMeta = {
      runId,
      timestamp: new Date().toISOString(),
      model: result.model,
      promptVersion,
      specPath: args.specPath,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      buildDurationMs: Date.now() - startedAt,
    };

    let deployedUrl: string | undefined;

    // 12. Optionally deploy.
    if (args.deploy) {
      // Lazy import keeps deploy.ts (and its child_process spawn) out of
      // the path for non-deploy runs.
      const { deploy } = await import('./deploy.ts');
      const outputPath = resolve(runPath, 'output');
      logger.info('deploying', { outputPath });
      deployedUrl = await deploy(outputPath);
      meta.deployedUrl = deployedUrl;
      logger.info('deployed', { deployedUrl });
    }

    writeRunMeta(runPath, meta);

    return { runPath, deployedUrl };
  } catch (err) {
    logger.error('generation failed', {
      error: err instanceof Error ? err.message : String(err),
      spec: args.specPath,
    });
    throw err;
  }
}
