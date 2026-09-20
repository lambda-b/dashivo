import { python } from "@codemirror/lang-python";
import CodeMirror from "@uiw/react-codemirror";

interface PythonCodeEditorProps {
  ariaLabel: string;
  height?: string;
  onChange: (source: string) => void;
  source: string;
}

export const PythonCodeEditor = ({
  ariaLabel,
  height = "22rem",
  onChange,
  source,
}: PythonCodeEditorProps) => (
  <div aria-label={ariaLabel} className="overflow-hidden rounded-lg border border-stone-300">
    <CodeMirror
      basicSetup={{ bracketMatching: true, foldGutter: true, lineNumbers: true }}
      extensions={[python()]}
      height={height}
      onChange={onChange}
      theme="light"
      value={source}
    />
  </div>
);
