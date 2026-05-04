import type { GeneratedFile } from './types.ts';

const FILE_FENCE_OPEN = /```file:([^\n\r`]*?)\s*\r?\n/g;

/**
 * Parse Claude's response into individual files.
 *
 * The response is expected to contain blocks of the form:
 *
 *     ```file:path/to/file.ts
 *     [file contents]
 *     ```
 *
 * Anything before the first ```file: marker is treated as preamble (the
 * <plan> block, prose, etc.) and ignored.
 *
 * TODO: future versions could also extract the <plan> block at the start
 * of the response and return it alongside the files for logging — the plan
 * is useful when debugging why the generated UI deviated from the spec.
 */
export function parseGeneratedFiles(claudeResponseText: string): GeneratedFile[] {
  const text = claudeResponseText;

  const matches: Array<{ path: string; index: number; markerEnd: number }> = [];
  let m: RegExpExecArray | null;
  FILE_FENCE_OPEN.lastIndex = 0;
  while ((m = FILE_FENCE_OPEN.exec(text)) !== null) {
    const rawPath = (m[1] ?? '').trim();
    if (rawPath === '') {
      const snippet = text.slice(m.index, Math.min(m.index + 80, text.length));
      throw new Error(`Malformed file block: missing path after \`file:\`. Block starts: ${snippet}`);
    }
    matches.push({ path: rawPath, index: m.index, markerEnd: m.index + m[0].length });
  }

  if (matches.length === 0) {
    throw new Error(
      'No file blocks found in Claude response. The prompt may have failed to enforce output format.',
    );
  }

  const files: GeneratedFile[] = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i]!;
    const next = matches[i + 1];
    const blockEnd = next ? next.index : text.length;
    const body = text.slice(current.markerEnd, blockEnd);

    const closingFenceIndex = body.lastIndexOf('```');
    if (closingFenceIndex === -1) {
      throw new Error(
        `Malformed file block for "${current.path}": no closing \`\`\` fence found before end of response.`,
      );
    }

    const contents = body.slice(0, closingFenceIndex).replace(/^\r?\n/, '').replace(/\r?\n\s*$/, '');

    files.push({ path: current.path, contents });
  }

  return files;
}
