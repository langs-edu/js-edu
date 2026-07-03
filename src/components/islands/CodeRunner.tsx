import { useEffect, useRef, useState } from 'preact/hooks';
import { annotateError, type JaAnnotation } from '../../engine/runner/errorJa';
import { JsSandbox } from '../../engine/runner/host';
import type { ConsoleLevel } from '../../engine/runner/protocol';
import type { EditorHandle } from '../editor/createEditor';
import { loadDraft, saveDraft } from './storage';

const TIMEOUT_MS = 2000;

interface Props {
  storageKey: string;
  initialCode: string;
  /**
   * CIの検証マーカー。実行がエラーで終わることを意図した教材であることを示す。
   * check-js.mjsが「非ゼロ終了を成功」と判定するために読むだけで、表示には影響しない。
   */
  expectError?: boolean;
  /**
   * CIの検証対象外マーカー（乱数・時刻など実行のたび結果が変わるもの、無限ループ例など）。
   * check-js.mjsが抽出をスキップするために読むだけで、表示には影響しない。
   */
  nocheck?: boolean;
}

interface ErrorView {
  title: string;
  annotation: JaAnnotation | null;
  timedOut: boolean;
}

/** レッスン本文に埋め込む、ブラウザ内実行のJavaScriptプレイグラウンド。 */
export default function CodeRunner({ storageKey, initialCode }: Props) {
  const editorParent = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorHandle | null>(null);
  const sandbox = useRef<JsSandbox | null>(null);

  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<{ level: ConsoleLevel; text: string }[]>([]);
  const [error, setError] = useState<ErrorView | null>(null);

  const execute = async () => {
    if (!editor.current || running) return;
    const code = editor.current.getCode();
    setRunning(true);
    setLogs([]);
    setError(null);

    sandbox.current ??= new JsSandbox();
    const collected: { level: ConsoleLevel; text: string }[] = [];
    const result = await sandbox.current.run(code, {
      timeoutMs: TIMEOUT_MS,
      onConsole: (level, text) => {
        collected.push({ level, text });
        setLogs([...collected]);
      },
    });
    setRunning(false);

    if (result.timedOut) {
      setError({
        title: `実行が${(TIMEOUT_MS / 1000).toFixed(0)}秒を超えたので、止めました。`,
        annotation: {
          reading: '終わらないくりかえし（無限ループ）になっているかもしれません。',
          hint: 'くりかえしの「終わる条件」が、いつか本当に成り立つか確かめてみてください。',
        },
        timedOut: true,
      });
      return;
    }

    if (!result.ok && result.error) {
      setError({
        title: `${result.error.name}: ${result.error.message}${result.error.line ? `（${result.error.line}行目あたり）` : ''}`,
        annotation: annotateError(result.error.message),
        timedOut: false,
      });
    }
  };

  const executeRef = useRef(execute);
  executeRef.current = execute;

  const reset = () => {
    editor.current?.setCode(initialCode);
    setLogs([]);
    setError(null);
    saveDraft(storageKey, null);
  };

  useEffect(() => {
    let disposed = false;
    const draft = loadDraft(storageKey);

    void import('../editor/createEditor').then(async ({ createEditor }) => {
      if (disposed || !editorParent.current) return;
      editor.current = await createEditor({
        parent: editorParent.current,
        doc: draft ?? initialCode,
        language: 'js',
        onRun: () => void executeRef.current(),
        onChange: (code) => {
          saveDraft(storageKey, code === initialCode ? null : code);
        },
      });
      setReady(true);
    });

    return () => {
      disposed = true;
      editor.current?.destroy();
      sandbox.current?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- storageKey/initialCodeは初回マウント時の値のみ使う
  }, []);

  return (
    <div class="runner" data-lang="js">
      <div class="runner-bar">
        <span class="runner-lang">JavaScript</span>
        <div class="runner-actions">
          <button type="button" class="runner-reset" onClick={reset}>
            もとに戻す
          </button>
          <button
            type="button"
            class="runner-run"
            onClick={() => void execute()}
            disabled={!ready || running}
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
            </svg>
            {running ? '実行中…' : '実行する'}
          </button>
        </div>
      </div>
      <div class="runner-editor" ref={editorParent}>
        {!ready && <pre class="runner-skeleton">{initialCode}</pre>}
      </div>
      {logs.length > 0 && (
        <div class="runner-output" role="log">
          {logs.map((l, i) => (
            <div key={i} class={`console-${l.level}`}>
              {l.text}
            </div>
          ))}
        </div>
      )}
      {error && (
        <div class="runner-error" role="alert">
          <p class="runner-error-message">{error.title}</p>
          {error.annotation && (
            <>
              <p class="runner-error-reading">{error.annotation.reading}</p>
              {error.annotation.hint && <p class="runner-error-hint">{error.annotation.hint}</p>}
            </>
          )}
        </div>
      )}
      <p class="runner-kbd-hint">
        <kbd>Ctrl</kbd>+<kbd>Enter</kbd> でも実行できます
      </p>
    </div>
  );
}
