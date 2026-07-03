import { useEffect, useRef, useState } from 'preact/hooks';
import type { EditorHandle } from '../editor/createEditor';
import { loadDraft, saveDraft } from './storage';

interface Props {
  storageKey: string;
  initialHtml: string;
  /** プレビューiframeの高さ（px）。省略時は200 */
  height?: number;
}

/** レッスン本文に埋め込む、HTML+JSをiframeサンドボックスで実行するプレイグラウンド（コース5・6用）。 */
export default function HtmlRunner({ storageKey, initialHtml, height = 200 }: Props) {
  const editorParent = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorHandle | null>(null);

  const [ready, setReady] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(initialHtml);
  const [runCount, setRunCount] = useState(0);

  const run = () => {
    const code = editor.current?.getCode() ?? initialHtml;
    setPreviewSrc(code);
    setRunCount((n) => n + 1);
  };

  const runRef = useRef(run);
  runRef.current = run;

  const reset = () => {
    editor.current?.setCode(initialHtml);
    setPreviewSrc(initialHtml);
    setRunCount((n) => n + 1);
    saveDraft(storageKey, null);
  };

  useEffect(() => {
    let disposed = false;
    const draft = loadDraft(storageKey);
    const startDoc = draft ?? initialHtml;

    void import('../editor/createEditor').then(async ({ createEditor }) => {
      if (disposed || !editorParent.current) return;
      editor.current = await createEditor({
        parent: editorParent.current,
        doc: startDoc,
        language: 'html',
        onRun: () => runRef.current(),
        onChange: (code) => {
          saveDraft(storageKey, code === initialHtml ? null : code);
        },
      });
      setReady(true);
      setPreviewSrc(startDoc);
    });

    return () => {
      disposed = true;
      editor.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- storageKey/initialHtmlは初回マウント時の値のみ使う
  }, []);

  return (
    <div class="runner" data-lang="html">
      <div class="runner-bar">
        <span class="runner-lang">HTML</span>
        <div class="runner-actions">
          <button type="button" class="runner-reset" onClick={reset}>
            もとに戻す
          </button>
          <button type="button" class="runner-run" onClick={run} disabled={!ready}>
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
            </svg>
            実行する
          </button>
        </div>
      </div>
      <div class="runner-editor" ref={editorParent}>
        {!ready && <pre class="runner-skeleton">{initialHtml}</pre>}
      </div>
      <div class="runner-preview-wrap">
        <iframe
          key={runCount}
          class="runner-preview"
          style={{ height: `${height}px` }}
          sandbox="allow-scripts"
          srcdoc={previewSrc}
          title="実行結果のプレビュー"
        />
      </div>
      <p class="runner-kbd-hint">
        <kbd>Ctrl</kbd>+<kbd>Enter</kbd> でも実行できます
      </p>
    </div>
  );
}
