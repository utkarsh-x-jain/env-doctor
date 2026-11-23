/**
 * Tests for the parser module.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { parseEnv, parseEnvFile, stringifyEnv } from '../src/parser.js';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('parser', () => {
  describe('parseEnv', () => {
    it('should parse simple KEY=value pairs', () => {
      const content = 'FOO=bar\nBAZ=qux';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'bar', BAZ: 'qux' });
    });

    it('should handle single-quoted values', () => {
      const content = "FOO='bar baz'";
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'bar baz' });
    });

    it('should handle double-quoted values', () => {
      const content = 'FOO="bar baz"';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'bar baz' });
    });

    it('should handle backtick-quoted values', () => {
      const content = 'FOO=`bar baz`';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'bar baz' });
    });

    it('should handle export syntax', () => {
      const content = 'export FOO=bar\nexport BAZ=qux';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'bar', BAZ: 'qux' });
    });

    it('should handle empty values', () => {
      const content = 'FOO=\nBAR=';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: '', BAR: '' });
    });

    it('should skip blank lines', () => {
      const content = 'FOO=bar\n\n\nBAR=qux';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'bar', BAR: 'qux' });
    });

    it('should skip full-line comments', () => {
      const content = '# This is a comment\nFOO=bar\n# Another comment\nBAR=qux';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'bar', BAR: 'qux' });
    });

    it('should handle inline comments', () => {
      const content = 'FOO=bar # comment\nBAR=qux # another';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'bar', BAR: 'qux' });
    });

    it('should not treat # in quoted values as comments', () => {
      const content = 'FOO="bar # not a comment"\nBAR=\'baz # also not\'';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'bar # not a comment', BAR: 'baz # also not' });
    });

    it('should handle spaces around assignments', () => {
      const content = 'FOO = bar\nBAR =qux\nBAZ= quux';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'bar', BAR: 'qux', BAZ: 'quux' });
    });

    it('should handle CRLF line endings', () => {
      const content = 'FOO=bar\r\nBAR=qux\r\n';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'bar', BAR: 'qux' });
    });

    it('should handle LF line endings', () => {
      const content = 'FOO=bar\nBAR=qux\n';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'bar', BAR: 'qux' });
    });

    it('should handle duplicate keys (last wins)', () => {
      const content = 'FOO=first\nFOO=second\nFOO=third';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'third' });
      // FOO appears 3 times, so 2 duplicates
      assert.deepStrictEqual(result.duplicates, ['FOO', 'FOO']);
    });

    it('should handle export without space', () => {
      const content = 'export FOO=bar\nexportBAZ=qux';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'bar', BAZ: 'qux' });
    });

    it('should handle escaped characters in double quotes', () => {
      const content = 'FOO="hello\\nworld"\nBAR="tab:\\ttest"';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'hello\nworld', BAR: 'tab:\ttest' });
    });

    it('should handle escaped characters in backticks', () => {
      const content = 'FOO=`hello\\nworld`';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'hello\nworld' });
    });

    it('should not escape in single quotes', () => {
      const content = "FOO='hello\\nworld'";
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'hello\\nworld' });
    });

    it('should ignore invalid variable names', () => {
      const content = '123INVALID=foo\nVALID=bar\nALSO-INVALID=baz';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { VALID: 'bar' });
      assert.deepStrictEqual(result.invalidKeys, ['123INVALID', 'ALSO-INVALID']);
    });

    it('should handle equals in quoted values', () => {
      const content = 'FOO="bar=baz"\nBAR=\'qux=quux\'';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'bar=baz', BAR: 'qux=quux' });
    });

    it('should handle multiline values in quotes', () => {
      const content = 'FOO="line1\\nline2\\nline3"';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'line1\nline2\nline3' });
    });

    it('should handle special characters in values', () => {
      const content = 'FOO=hello@world.com\nBAR=path/to/file\nBAZ=$HOME/.config';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'hello@world.com', BAR: 'path/to/file', BAZ: '$HOME/.config' });
    });

    it('should handle multiple duplicate keys', () => {
      const content = 'FOO=first\nBAR=second\nFOO=third\nBAZ=fourth\nBAR=fifth';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'third', BAR: 'fifth', BAZ: 'fourth' });
      assert.deepStrictEqual(result.duplicates.sort(), ['BAR', 'FOO'].sort());
    });

    it('should handle value with escaped quote in double quotes', () => {
      const content = 'FOO="hello \\"world\\""';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'hello "world"' });
    });

    it('should handle value with escaped backtick in backticks', () => {
      const content = 'FOO=`hello \\`world\\``';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'hello `world`' });
    });

    it('should handle value with escaped dollar sign', () => {
      const content = 'FOO="price: \\$100"';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { FOO: 'price: $100' });
    });

    it('should handle empty key gracefully', () => {
      const content = '=value\nVALID=ok';
      const result = parseEnv(content);
      assert.deepStrictEqual(result.parsed, { VALID: 'ok' });
      assert.deepStrictEqual(result.invalidKeys, ['']);
    });
  });

  describe('parseEnvFile', () => {
    let tempDir;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'env-doctor-test-'));
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it('should parse a file successfully', async () => {
      const filePath = join(tempDir, '.env');
      await writeFile(filePath, 'FOO=bar\nBAR=qux');
      const result = await parseEnvFile(filePath);
      assert.deepStrictEqual(result.parsed, { FOO: 'bar', BAR: 'qux' });
    });

    it('should return null for non-existent file', async () => {
      const filePath = join(tempDir, 'nonexistent.env');
      const result = await parseEnvFile(filePath);
      assert.strictEqual(result, null);
    });
  });

  describe('stringifyEnv', () => {
    it('should stringify environment variables', () => {
      const env = { FOO: 'bar', BAR: 'qux' };
      const result = stringifyEnv(env);
      assert.ok(result.includes('FOO="bar"'));
      assert.ok(result.includes('BAR="qux"'));
    });

    it('should escape special characters', () => {
      const env = { FOO: 'hello\nworld', BAR: 'tab:\ttest', BAZ: 'quote:"test"' };
      const result = stringifyEnv(env);
      assert.ok(result.includes('hello\\nworld'));
      assert.ok(result.includes('tab:\\ttest'));
      assert.ok(result.includes('quote:\\"test\\"'));
    });
  });
});