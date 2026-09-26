import { parse } from "yaml";
import { z } from "zod";
import { snippetCompletion, type CompletionContext } from "@codemirror/autocomplete";
import type { EditorView } from "@codemirror/view";
import source from "@/builder/workbench/code/snippets.yaml?raw";

export const snippets = z
  .array(z.object({ label: z.string(), detail: z.string(), template: z.string() }))
  .parse(parse(source));

const options = snippets.map(({ template, ...option }) =>
  snippetCompletion(template.trimEnd(), { ...option, type: "snippet" }),
);

export const completeSnippet = (context: CompletionContext) => {
  const word = context.matchBefore(/#\w*/);
  if (!word) return null;

  return { from: word.from, options, validFor: /^#\w*$/ };
};

export const applyExactSnippet = (view: EditorView) => {
  const cursor = view.state.selection.main;
  if (!cursor.empty) return false;

  const line = view.state.doc.lineAt(cursor.from);
  const trigger = view.state.sliceDoc(line.from, cursor.from).match(/#\w*$/)?.[0];
  const option = options.find(({ label }) => label === trigger);
  if (!trigger || !option || typeof option.apply !== "function") return false;

  option.apply(view, option, cursor.from - trigger.length, cursor.to);
  return true;
};
