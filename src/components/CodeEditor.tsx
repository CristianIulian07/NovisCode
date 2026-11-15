import { useEffect, useRef } from 'react';
import { EditorState, Compartment, StateEffect, StateField } from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentLess, insertTab } from '@codemirror/commands';
import { HighlightStyle, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { html } from '@codemirror/lang-html';
import { cpp } from '@codemirror/lang-cpp';
import { tags } from '@lezer/highlight';
import type { SelectedLanguage } from '../shared/types';

export interface HighlightRange {
  start: number;
  end: number;
  nonce: number;
}

interface CodeEditorProps {
  value: string;
  onChange: (nextValue: string) => void;
  language: SelectedLanguage;
  highlightedRange: HighlightRange | null;
  onSubmit: () => void;
  disabled?: boolean;
}

const setHighlightedLines = StateEffect.define<{ start: number; end: number } | null>();

const highlightedLineDecoration = Decoration.line({ class: 'cm-highlighted-line' });

const highlightLinesField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setHighlightedLines)) {
        const range = effect.value;
        if (!range) {
          return Decoration.none;
        }
        const totalLines = tr.state.doc.lines;
        const startLine = Math.min(Math.max(1, range.start), totalLines);
        const endLine = Math.min(Math.max(startLine, range.end), totalLines);
        const builder = [];
        for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
          const line = tr.state.doc.line(lineNum);
          builder.push(highlightedLineDecoration.range(line.from));
        }
        return Decoration.set(builder);
      }
    }
    if (tr.docChanged) {
      return Decoration.none;
    }
    return decorations;
  },
  provide: (field) => EditorView.decorations.from(field),
});

const editorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#111318',
      color: '#ECEEF2',
      fontSize: '13.5px',
      fontFamily: 'var(--font-mono)',
      height: '100%',
    },
    '.cm-scroller': {
      overflow: 'auto',
      lineHeight: '1.6',
      fontFamily: 'var(--font-mono)',
    },
    '.cm-content': {
      padding: '12px 0',
      caretColor: '#38BDF8',
    },
    '.cm-line': {
      padding: '0 16px 0 12px',
    },
    '.cm-gutters': {
      backgroundColor: '#111318',
      color: '#5C6373',
      borderRight: '1px solid #22262F',
      minWidth: '46px',
      userSelect: 'none',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 10px 0 8px',
      fontVariantNumeric: 'tabular-nums',
      fontSize: '12px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255, 255, 255, 0.025)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      color: '#A1A8B8',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(56, 189, 248, 0.22)',
    },
    '.cm-selectionBackground': {
      backgroundColor: 'rgba(56, 189, 248, 0.16)',
    },
    '.cm-cursor': {
      borderLeftColor: '#38BDF8',
      borderLeftWidth: '2px',
    },
    '.cm-placeholder': {
      color: '#6B7280',
      fontStyle: 'normal',
    },
  },
  { dark: true },
);

const neutralHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#7DD3FC' },
  { tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: '#ECEEF2' },
  { tag: [tags.propertyName], color: '#CBD5E1' },
  { tag: [tags.function(tags.variableName), tags.labelName], color: '#93C5FD' },
  { tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: '#FCD34D' },
  { tag: [tags.definition(tags.name), tags.separator], color: '#E2E8F0' },
  { tag: [tags.typeName, tags.className, tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace], color: '#FDE68A' },
  { tag: [tags.operator, tags.operatorKeyword, tags.url, tags.escape, tags.regexp, tags.link], color: '#94A3B8' },
  { tag: [tags.meta, tags.comment], color: '#6E7687', fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.tagName, color: '#7DD3FC' },
  { tag: tags.attributeName, color: '#CBD5E1' },
  { tag: [tags.string, tags.attributeValue], color: '#86EFAC' },
  { tag: tags.invalid, color: '#FCA5A5' },
]);

export function CodeEditor({
  value,
  onChange,
  language,
  highlightedRange,
  onSubmit,
  disabled = false,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageCompartment = useRef(new Compartment());
  const readOnlyCompartment = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  const onSubmitRef = useRef(onSubmit);

  onChangeRef.current = onChange;
  onSubmitRef.current = onSubmit;

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const submitKeymap = keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          onSubmitRef.current();
          return true;
        },
      },
      {
        key: 'Tab',
        run: insertTab,
        shift: indentLess,
      },
    ]);

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        indentUnit.of('  '),
        EditorState.tabSize.of(2),
        submitKeymap,
        keymap.of([...defaultKeymap, ...historyKeymap]),
        languageCompartment.current.of(language === 'cpp' ? cpp() : html()),
        readOnlyCompartment.current.of(EditorState.readOnly.of(disabled)),
        editorTheme,
        syntaxHighlighting(neutralHighlightStyle),
        highlightLinesField,
        placeholder('Lipește aici codul tău HTML/CSS sau C++...'),
        EditorView.contentAttributes.of({
          'aria-label': 'Editor de cod',
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Intentionally initialize CodeMirror once; value/language/disabled sync via effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
        effects: setHighlightedLines.of(null),
      });
    }
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: languageCompartment.current.reconfigure(language === 'cpp' ? cpp() : html()),
    });
  }, [language]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: readOnlyCompartment.current.reconfigure(EditorState.readOnly.of(disabled)),
    });
  }, [disabled]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    if (!highlightedRange) {
      view.dispatch({
        effects: setHighlightedLines.of(null),
      });
      return;
    }

    const totalLines = view.state.doc.lines;
    const targetLineNum = Math.min(Math.max(1, highlightedRange.start), totalLines);
    const targetLine = view.state.doc.line(targetLineNum);

    view.dispatch({
      effects: [
        setHighlightedLines.of({ start: highlightedRange.start, end: highlightedRange.end }),
        EditorView.scrollIntoView(targetLine.from, { y: 'center' }),
      ],
    });
  }, [highlightedRange]);

  return (
    <div
      ref={containerRef}
      data-testid="code-editor"
      className="h-[340px] sm:h-[420px] lg:h-[500px] w-full overflow-hidden rounded-lg border border-[#262A33] bg-[#111318] focus-within:border-[#38BDF8] focus-within:ring-1 focus-within:ring-[#38BDF8]"
    />
  );
}
