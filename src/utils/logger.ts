import chalk from 'chalk';

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveLevel(): Level {
  const raw = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
    return raw;
  }
  return 'info';
}

const COLORS: Record<Level, (s: string) => string> = {
  debug: chalk.gray,
  info: chalk.blue,
  warn: chalk.yellow,
  error: chalk.red,
};

function emit(level: Level, message: string, meta?: Record<string, unknown>): void {
  const configured = resolveLevel();
  if (LEVEL_ORDER[level] < LEVEL_ORDER[configured]) return;

  const ts = new Date().toISOString();
  const colored = COLORS[level](level.padEnd(5));
  const metaStr = meta && Object.keys(meta).length > 0 ? ' ' + JSON.stringify(meta) : '';
  const line = `[${ts}] ${colored} ${message}${metaStr}`;

  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => emit('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => emit('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit('error', message, meta),
};
