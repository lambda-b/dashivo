import { python } from "@codemirror/lang-python";
import { indentUnit } from "@codemirror/language";
import {
  autocompletion,
  acceptCompletion,
  nextSnippetField,
  prevSnippetField,
} from "@codemirror/autocomplete";
import { indentWithTab } from "@codemirror/commands";
import { Prec } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { completeSnippet } from "@/builder/workbench/code/snippets";

const basicSetup = { autocompletion: false };
const extensions = [
  python(),
  indentUnit.of("    "),
  autocompletion({ override: [completeSnippet] }),
  Prec.highest(
    keymap.of([
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
