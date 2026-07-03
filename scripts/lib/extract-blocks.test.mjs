import { describe, expect, it } from 'vitest';
import {
  classifyJsMeta,
  extractCodeBlocks,
  extractCodeRunnerBlocks,
  unescapeInitialCode,
} from './extract-blocks.mjs';

describe('extractCodeBlocks', () => {
  it('extracts a js block with a title meta', () => {
    const source = ['# タイトル', '', '```js title="hello.js"', 'console.log("hello")', '```', '', '本文'].join(
      '\n',
    );

    const blocks = extractCodeBlocks(source, 'a.mdx');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      lang: 'js',
      meta: 'title="hello.js"',
      file: 'a.mdx',
      line: 3,
    });
    expect(blocks[0].body).toBe('console.log("hello")');
  });

  it('extracts a js fragment with no meta at all (bare fence line)', () => {
    const source = ['```js', 'const x = 1;', 'console.log(x);', '```'].join('\n');
    const blocks = extractCodeBlocks(source, 'bare.mdx');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].meta).toBe('');
    expect(blocks[0].body).toBe('const x = 1;\nconsole.log(x);');
  });

  it('extracts blocks of mixed languages (js/html/console), ignoring other fences', () => {
    const source = [
      '```console',
      '$ node hello.js',
      '```',
      '',
      '```js',
      'const x = 1;',
      '```',
      '',
      '```html',
      '<p id="a"></p>',
      '```',
      '',
      '```text',
      'ただの文章',
      '```',
    ].join('\n');

    const blocks = extractCodeBlocks(source, 'b.mdx');
    expect(blocks).toHaveLength(3);
    expect(blocks.map((b) => b.lang)).toEqual(['console', 'js', 'html']);
    expect(blocks[1].body).toBe('const x = 1;');
  });

  it('does not match a fence whose language name only starts with js/html/console', () => {
    const source = ['```jsx', 'not a real js fence', '```', '', '```consoled', 'nope', '```'].join('\n');
    expect(extractCodeBlocks(source, 'near-miss.mdx')).toEqual([]);
  });

  it('returns an empty array when there are no matching fences', () => {
    const source = 'ただの文章です。\n\n```toml\nkey = 1\n```\n';
    expect(extractCodeBlocks(source, 'c.mdx')).toEqual([]);
  });

  it('handles an unterminated fence by taking the rest of the file as the body', () => {
    const source = ['```js', 'console.log(1)'].join('\n');
    const blocks = extractCodeBlocks(source, 'd.mdx');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].body).toBe('console.log(1)');
  });
});

describe('classifyJsMeta', () => {
  it('classifies an empty meta as a fragment with no expect-error', () => {
    expect(classifyJsMeta('')).toEqual({ mode: 'fragment', expectError: false });
  });

  it('classifies title="X.js" as a file with the given filename', () => {
    expect(classifyJsMeta('title="hello.js"')).toEqual({
      mode: 'file',
      filename: 'hello.js',
      expectError: false,
    });
  });

  it('classifies nocheck as nocheck, even alongside other tokens', () => {
    expect(classifyJsMeta('nocheck')).toEqual({ mode: 'nocheck' });
    expect(classifyJsMeta('title="bad.js" nocheck')).toEqual({ mode: 'nocheck' });
  });

  it('recognizes expect-error as a bare token', () => {
    expect(classifyJsMeta('title="crash.js" expect-error')).toEqual({
      mode: 'file',
      filename: 'crash.js',
      expectError: true,
    });
  });

  it('handles a fragment (no title) with expect-error', () => {
    expect(classifyJsMeta('expect-error')).toEqual({ mode: 'fragment', expectError: true });
  });
});

describe('unescapeInitialCode', () => {
  it('turns an escaped backtick into a real backtick', () => {
    expect(unescapeInitialCode('const s = \\`hi\\`;')).toBe('const s = `hi`;');
  });

  it('turns an escaped ${ into a real template interpolation opener', () => {
    expect(unescapeInitialCode('console.log(\\`\\${yatai}、ひとつ\\`);')).toBe(
      'console.log(`${yatai}、ひとつ`);',
    );
  });

  it('leaves unrelated backslash sequences untouched (they are real JS escapes)', () => {
    expect(unescapeInitialCode('console.log("a\\nb");')).toBe('console.log("a\\nb");');
  });

  it('passes through strings with no escapes unchanged', () => {
    expect(unescapeInitialCode('const x = 1;\nconsole.log(x);')).toBe('const x = 1;\nconsole.log(x);');
  });
});

describe('extractCodeRunnerBlocks', () => {
  it('extracts a plain initialCode with storageKey', () => {
    const source = [
      "import CodeRunner from '../../../components/islands/CodeRunner';",
      '',
      '<CodeRunner',
      '  client:visible',
      '  storageKey="hajimete-02-a"',
      '  initialCode={`const yatai = "りんご飴";',
      'console.log(yatai + "、ひとつください");`}',
      '/>',
    ].join('\n');

    const blocks = extractCodeRunnerBlocks(source, 'lesson.mdx');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].storageKey).toBe('hajimete-02-a');
    expect(blocks[0].code).toBe('const yatai = "りんご飴";\nconsole.log(yatai + "、ひとつください");');
    expect(blocks[0].expectError).toBe(false);
    expect(blocks[0].nocheck).toBe(false);
  });

  it('unescapes backtick and ${ escapes inside initialCode (template-literal-in-template-literal case)', () => {
    // レッスン1-05のテンプレートリテラル説明のように、initialCode自体がバッククォートと
    // ${ を含む例。MDX上ではエスケープして書く契約になっている。
    const source = [
      '<CodeRunner',
      '  client:visible',
      '  storageKey="hajimete-05-a"',
      '  initialCode={`const yatai = "りんご飴";',
      'console.log(\\`\\${yatai}、ひとつください\\`);`}',
      '/>',
    ].join('\n');

    const blocks = extractCodeRunnerBlocks(source, 'lesson.mdx');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].code).toBe(
      'const yatai = "りんご飴";\nconsole.log(`${yatai}、ひとつください`);',
    );
  });

  it('detects a bare expectError prop', () => {
    const source = [
      '<CodeRunner',
      '  storageKey="hajimete-07-a"',
      '  initialCode={`nai.hoge;`}',
      '  expectError',
      '/>',
    ].join('\n');
    const blocks = extractCodeRunnerBlocks(source, 'lesson.mdx');
    expect(blocks[0].expectError).toBe(true);
    expect(blocks[0].nocheck).toBe(false);
  });

  it('detects a bare nocheck prop', () => {
    const source = [
      '<CodeRunner',
      '  storageKey="nagare-03-a"',
      '  initialCode={`while (true) {}`}',
      '  nocheck',
      '/>',
    ].join('\n');
    const blocks = extractCodeRunnerBlocks(source, 'lesson.mdx');
    expect(blocks[0].nocheck).toBe(true);
    expect(blocks[0].expectError).toBe(false);
  });

  it('supports explicit ={true}/{false} forms', () => {
    const source = [
      '<CodeRunner storageKey="a" initialCode={`1;`} expectError={true} nocheck={false} />',
    ].join('\n');
    const blocks = extractCodeRunnerBlocks(source, 'lesson.mdx');
    expect(blocks[0].expectError).toBe(true);
    expect(blocks[0].nocheck).toBe(false);
  });

  it('extracts multiple CodeRunner blocks from the same file, in order', () => {
    const source = [
      '<CodeRunner storageKey="a" initialCode={`1;`} />',
      '',
      'ほんぶん',
      '',
      '<CodeRunner storageKey="b" initialCode={`2;`} />',
    ].join('\n');
    const blocks = extractCodeRunnerBlocks(source, 'lesson.mdx');
    expect(blocks).toHaveLength(2);
    expect(blocks.map((b) => b.storageKey)).toEqual(['a', 'b']);
  });

  it('returns an empty array when there is no CodeRunner in the file', () => {
    expect(extractCodeRunnerBlocks('ただの文章です。', 'none.mdx')).toEqual([]);
  });
});
