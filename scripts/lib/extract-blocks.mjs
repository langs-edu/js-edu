/**
 * MDXソースから js/html/console のコードフェンス、および CodeRunner の initialCode を
 * 抽出し、メタ情報を分類する純関数群。ファイルI/Oを一切行わない（テスト容易性のため）。
 */

// 言語トークンの直後は「空白＋残り」か「行末」のどちらかでなければならない。
// これにより ```jsx のような別語への誤マッチを防ぐ。
const FENCE_OPEN_RE = /^```(js|html|console)(?:\s+(.*))?\s*$/;
const FENCE_CLOSE_RE = /^```\s*$/;

/**
 * @param {string} source MDXファイルの全文
 * @param {string} file レポート表示用のファイルパス
 * @returns {{ lang: 'js'|'html'|'console', meta: string, body: string, file: string, line: number }[]}
 */
export function extractCodeBlocks(source, file) {
  const lines = source.split(/\r?\n/);
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const open = FENCE_OPEN_RE.exec(lines[i]);
    if (open) {
      const lang = /** @type {'js'|'html'|'console'} */ (open[1]);
      const meta = (open[2] ?? '').trim();
      const line = i + 1; // 1-based
      const bodyLines = [];
      let j = i + 1;
      while (j < lines.length && !FENCE_CLOSE_RE.test(lines[j])) {
        bodyLines.push(lines[j]);
        j++;
      }
      blocks.push({ lang, meta, body: bodyLines.join('\n'), file, line });
      i = j + 1;
    } else {
      i += 1;
    }
  }
  return blocks;
}

/**
 * ```js フェンスのメタ文字列を分類する。
 * - `nocheck` トークンを含む → nocheck（他のトークンがあっても最優先）
 * - `title="X.js"` を含む → file（Xがファイル名、レポート表示用）。無ければ fragment
 * - `expect-error` トークンがあれば非ゼロ終了を成功とみなす
 * @param {string} meta
 * @returns {{ mode: 'nocheck' } | { mode: 'file', filename: string, expectError: boolean } | { mode: 'fragment', expectError: boolean }}
 */
export function classifyJsMeta(meta) {
  const titleMatch = meta.match(/title="([^"]*)"/);

  let rest = meta;
  if (titleMatch) rest = rest.replace(titleMatch[0], '');
  const tokens = rest.split(/\s+/).filter(Boolean);

  if (tokens.includes('nocheck')) {
    return { mode: 'nocheck' };
  }

  const expectError = tokens.includes('expect-error');

  if (titleMatch) {
    return { mode: 'file', filename: titleMatch[1], expectError };
  }
  return { mode: 'fragment', expectError };
}

/**
 * CodeRunnerのinitialCode（テンプレートリテラル）内で、外側のJSXテンプレートリテラルを
 * 終端させないために書かれたエスケープ（`\`` と `\${`）を、実際の文字へ戻す。
 * それ以外のバックスラッシュ列（`\n`・`\\` など）はJSの通常のエスケープなので触らない
 * ——抽出結果をそのままNodeへ渡せば、それらは実行時に正しく解釈される。
 * @param {string} raw
 * @returns {string}
 */
export function unescapeInitialCode(raw) {
  return raw.replace(/\\`|\\\$\{/g, (m) => (m === '\\`' ? '`' : '${'));
}

// initialCode={`...`} の中身を、エスケープされたバッククォートを終端と誤認せずに取り出す。
// 「エスケープされた1文字」または「バッククォート・バックスラッシュ以外の1文字」の繰り返しとして、
// 最初のエスケープされていないバッククォートまでを本体とみなす（文字列リテラルの一般的な文法）。
const CODE_RUNNER_INITIAL_CODE_RE = /initialCode=\{`((?:\\[\s\S]|[^`\\])*)`\}/g;

/**
 * @param {string} name プロップ名（例: 'expectError'）
 * @param {string} text 探索対象のテキスト（initialCode本体を除いたタグの残り）
 * @returns {boolean}
 */
function hasBooleanProp(text, name) {
  const re = new RegExp(`\\b${name}\\b(?:\\s*=\\s*\\{\\s*(true|false)\\s*\\})?`);
  const m = text.match(re);
  if (!m) return false;
  return m[1] !== 'false';
}

/**
 * MDXソース中の `<CodeRunner ... initialCode={`...`} ... />` を抽出する。
 * `expectError` / `nocheck` プロップ（裸のブール属性、`={true}` / `={false}` の両方）も検出する。
 * @param {string} source
 * @param {string} file
 * @returns {{ storageKey: string|undefined, code: string, expectError: boolean, nocheck: boolean, file: string, line: number }[]}
 */
export function extractCodeRunnerBlocks(source, file) {
  const blocks = [];
  const re = new RegExp(CODE_RUNNER_INITIAL_CODE_RE);
  let m;
  while ((m = re.exec(source))) {
    const raw = m[1] ?? '';
    const matchStart = m.index;
    const matchEnd = m.index + m[0].length;

    const tagStart = source.lastIndexOf('<CodeRunner', matchStart);
    if (tagStart === -1) continue; // 対応する開始タグが見つからない壊れたMDXは無視する

    const closeIdx = source.indexOf('/>', matchEnd);
    const tagEnd = closeIdx === -1 ? matchEnd : closeIdx + 2;

    const outside = source.slice(tagStart, matchStart) + source.slice(matchEnd, tagEnd);
    const storageKeyMatch = outside.match(/storageKey="([^"]*)"/);
    const line = source.slice(0, tagStart).split(/\r?\n/).length;

    blocks.push({
      storageKey: storageKeyMatch ? storageKeyMatch[1] : undefined,
      code: unescapeInitialCode(raw),
      expectError: hasBooleanProp(outside, 'expectError'),
      nocheck: hasBooleanProp(outside, 'nocheck'),
      file,
      line,
    });
  }
  return blocks;
}
