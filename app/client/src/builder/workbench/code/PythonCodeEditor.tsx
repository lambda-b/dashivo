import { python, globalCompletion, localCompletionSource } from "@codemirror/lang-python";
import { indentUnit } from "@codemirror/language";
import {
  autocompletion,
  acceptCompletion,
  nextSnippetField,
  prevSnippetField,
  type CompletionContext,
} from "@codemirror/autocomplete";
import { indentWithTab } from "@codemirror/commands";
import { Prec } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { applyExactSnippet, completeSnippet } from "@/builder/workbench/code/snippets";
import { completeLibraries } from "@/builder/workbench/code/completions";

const basicSetup = { autocompletion: false };
const pythonCompletions = [localCompletionSource, globalCompletion].map(
  (source) => (context: CompletionContext) =>
    context.matchBefore(/\.\w*$/) ? null : source(context),
);
const extensions = [
  python(),
  indentUnit.of("    "),
  autocompletion({ override: [completeSnippet, completeLibraries, ...pythonCompletions] }),
  Prec.highest(
    keymap.of([
      { key: "Tab", run: applyExactSnippet },
      { key: "Tab", run: acceptCompletion },
      { key: "Tab", run: nextSnippetField, shift: prevSnippetField },
      indentWithTab,
    ]),
  ),
];

export const PythonCodeEditor = ({
  source,
  onChange,
}: {
  source: string;
  onChange: (source: string) => void;
}) => (
  <CodeMirror
    aria-label="Pythonコード"
    value={source}
    onChange={onChange}
    height="100%"
    className="h-full min-h-0 overflow-auto"
    extensions={extensions}
    indentWithTab={false}
    basicSetup={basicSetup}
  />
);
