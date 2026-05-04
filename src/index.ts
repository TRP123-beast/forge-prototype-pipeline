import 'dotenv/config';
import chalk from 'chalk';
import { generate } from './generate.ts';
import { deploy } from './deploy.ts';
import { logger } from './utils/logger.ts';

const USAGE = `Usage:

  npm run generate -- --spec=<path> [--deploy] [--prompt-version=v1] [--model=<model>]
  npm run deploy   -- --path=<runPath>
  npm run dev      -- --help

Examples:
  npm run generate -- --spec=fixtures/booking_spec.md --deploy
  npm run deploy   -- --path=runs/2026-05-04T10-00-00_booking/output
`;

interface ParsedArgs {
  command: string | undefined;
  flags: Map<string, string>;
  bools: Set<string>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const flags = new Map<string, string>();
  const bools = new Set<string>();
  let command: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (!a.startsWith('--')) {
      if (command === undefined) command = a;
      continue;
    }

    const body = a.slice(2);
    const eq = body.indexOf('=');
    if (eq !== -1) {
      flags.set(body.slice(0, eq), body.slice(eq + 1));
    } else {
      const next = args[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags.set(body, next);
        i++;
      } else {
        bools.add(body);
      }
    }
  }

  return { command, flags, bools };
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv);

  if (parsed.bools.has('help') || parsed.command === undefined) {
    process.stdout.write(USAGE);
    return;
  }

  switch (parsed.command) {
    case 'generate': {
      const specPath = parsed.flags.get('spec');
      if (!specPath) {
        throw new Error('Missing --spec=<path>');
      }
      const result = await generate({
        specPath,
        deploy: parsed.bools.has('deploy'),
        model: parsed.flags.get('model'),
        promptVersion: parsed.flags.get('prompt-version'),
      });
      console.log(chalk.green(`✓ run folder: ${result.runPath}`));
      if (result.deployedUrl) {
        console.log(chalk.green(`✓ deployed: ${result.deployedUrl}`));
      }
      return;
    }

    case 'deploy': {
      const runPath = parsed.flags.get('path');
      if (!runPath) {
        throw new Error('Missing --path=<runPath>');
      }
      const url = await deploy(runPath);
      console.log(chalk.green(`✓ deployed: ${url}`));
      return;
    }

    default: {
      process.stderr.write(`Unknown command: ${parsed.command}\n\n${USAGE}`);
      process.exitCode = 1;
    }
  }
}

main().catch((err) => {
  logger.error('command failed', { error: err instanceof Error ? err.message : String(err) });
  process.exitCode = 1;
});
