import { describe, expect, it } from 'vitest';
import { parseGeneratedFiles } from '../../src/parser.ts';

describe('parseGeneratedFiles', () => {
  it('parses three valid file blocks into three GeneratedFile objects', () => {
    const response = [
      '```file:package.json',
      '{ "name": "x" }',
      '```',
      '',
      '```file:src/App.tsx',
      'export default function App() { return null; }',
      '```',
      '',
      '```file:src/index.css',
      '@tailwind base;',
      '```',
      '',
    ].join('\n');

    const files = parseGeneratedFiles(response);

    expect(files).toHaveLength(3);
    expect(files[0]).toEqual({ path: 'package.json', contents: '{ "name": "x" }' });
    expect(files[1]).toEqual({
      path: 'src/App.tsx',
      contents: 'export default function App() { return null; }',
    });
    expect(files[2]).toEqual({ path: 'src/index.css', contents: '@tailwind base;' });
  });

  it('ignores leading prose before the first file block', () => {
    const response = [
      '<plan>',
      'Some plan text describing what we will build.',
      '</plan>',
      '',
      'Here is the implementation:',
      '',
      '```file:src/main.tsx',
      'console.log("hi");',
      '```',
    ].join('\n');

    const files = parseGeneratedFiles(response);

    expect(files).toHaveLength(1);
    expect(files[0]?.path).toBe('src/main.tsx');
    expect(files[0]?.contents).toBe('console.log("hi");');
  });

  it('throws a clear error when no file blocks are found', () => {
    const response = 'I am sorry, I cannot fulfill that request. Here is some prose instead.';
    expect(() => parseGeneratedFiles(response)).toThrow(/No file blocks found/);
  });

  it('throws a clear error when a block has no path after `file:`', () => {
    const response = ['```file:', 'oops', '```'].join('\n');
    expect(() => parseGeneratedFiles(response)).toThrow(/Malformed file block/);
  });

  it('preserves internal whitespace exactly', () => {
    const body = ['line 1', '', '  indented', '\t\ttabs', '', 'line 5'].join('\n');
    const response = ['```file:src/whitespace.ts', body, '```', ''].join('\n');

    const files = parseGeneratedFiles(response);

    expect(files).toHaveLength(1);
    expect(files[0]?.contents).toBe(body);
  });
});
