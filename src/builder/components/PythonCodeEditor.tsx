import { python } from "@codemirror/lang-python";
import CodeMirror from "@uiw/react-codemirror";

interface PythonCodeEditorProps {
  ariaLabel: string;
  onChange: (source: string) => void;
  source: string;
}

export const PythonCodeEditor = ({ ariaLabel, onChange, source }: PythonCodeEditorProps) => (
  <div aria-label={ariaLabel} className="overflow-hidden rounded-lg border border-stone-300">
    <CodeMirror
      basicSetup={{ bracketMatching: true, foldGutter: true, lineNumbers: true }}
      extensions={[python()]}
      height="22rem"
      onChange={onChange}
      theme="light"
      value={source}
    />
  </div>
);
