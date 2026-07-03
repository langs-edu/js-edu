import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching } from '@codemirror/language';
import { EditorState, Prec } from '@codemirror/state';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder,
} from '@codemirror/view';
import { ennichiHighlight, ennichiTheme } from './theme';

export interface EditorHandle {
  view: EditorView;
  getCode(): string;
  setCode(code: string): void;
  destroy(): void;
}

export interface CreateEditorOptions {
  parent: HTMLElement;
  doc: string;
  language: 'js' | 'html';
  onChange?: (code: string) => void;
  onRun?: () => void;
  placeholder?: string;
}

export async function createEditor(opts: CreateEditorOptions): Promise<EditorHandle> {
  const langExt =
    opts.language === 'html'
      ? (await import('@codemirror/lang-html')).html()
      : (await import('@codemirror/lang-javascript')).javascript();

  const runKeymap = Prec.highest(
    keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          opts.onRun?.();
          return true;
        },
      },
    ]),
  );

  const state = EditorState.create({
    doc: opts.doc,
    extensions: [
      runKeymap,
      lineNumbers(),
      history(),
      drawSelection(),
      bracketMatching(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      langExt,
      ennichiTheme,
      ennichiHighlight,
      EditorView.contentAttributes.of({
        'aria-label': opts.language === 'html' ? 'HTMLのコードエディタ' : 'JavaScriptのコードエディタ',
      }),
      EditorView.lineWrapping,
      ...(opts.placeholder ? [placeholder(opts.placeholder)] : []),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) opts.onChange?.(update.state.doc.toString());
      }),
    ],
  });

  const view = new EditorView({ state, parent: opts.parent });

  return {
    view,
    getCode: () => view.state.doc.toString(),
    setCode: (code) => {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } });
    },
    destroy: () => view.destroy(),
  };
}
