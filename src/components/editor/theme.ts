import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';

/** 縁日のデザイントークンに馴染むエディタテーマ */
export const ennichiTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--c-editor-bg)',
    color: 'var(--c-ink)',
    fontSize: '16px', // iOS Safariのフォーカス時ズームを防ぐため16px以上
    borderRadius: 'var(--radius-md)',
  },
  '.cm-content': {
    fontFamily: 'var(--font-code)',
    padding: '12px 0',
    lineHeight: '1.8',
    caretColor: 'var(--c-aka)',
  },
  '.cm-line': { padding: '0 12px' },
  '&.cm-focused': { outline: 'none' },
  '.cm-cursor': { borderLeftColor: 'var(--c-aka)', borderLeftWidth: '2px' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    background: 'color-mix(in srgb, var(--c-kon) 22%, transparent) !important',
  },
  '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--c-kon) 6%, transparent)' },
  '.cm-gutters': {
    backgroundColor: 'var(--c-editor-gutter)',
    color: 'var(--c-ink-3)',
    border: 'none',
    borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
    fontFamily: 'var(--font-code)',
    fontSize: '13px',
  },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--c-kon)' },
  '.cm-lintRange-error': {
    backgroundImage: 'none',
    textDecoration: 'underline wavy var(--c-aka) 1.5px',
    textUnderlineOffset: '4px',
  },
});

export const ennichiHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: 'var(--c-kon)', fontWeight: '600' },
    { tag: tags.string, color: 'var(--c-aka)' },
    { tag: tags.number, color: 'var(--c-mizu)' },
    { tag: tags.comment, color: 'var(--c-ink-3)', fontStyle: 'italic' },
    { tag: tags.variableName, color: 'var(--c-ink)' },
    { tag: tags.operator, color: 'var(--c-ink-2)' },
    { tag: [tags.bracket, tags.punctuation], color: 'var(--c-ink-2)' },
    { tag: tags.function(tags.variableName), color: 'var(--c-mizu)' },
    { tag: tags.definition(tags.variableName), color: 'var(--c-ink)' },
    { tag: tags.propertyName, color: 'var(--c-mizu)' },
    { tag: tags.bool, color: 'var(--c-kon)' },
    // HTML用
    { tag: tags.tagName, color: 'var(--c-kon)', fontWeight: '600' },
    { tag: tags.attributeName, color: 'var(--c-mizu)' },
    { tag: tags.attributeValue, color: 'var(--c-aka)' },
    { tag: tags.angleBracket, color: 'var(--c-ink-2)' },
  ]),
);
