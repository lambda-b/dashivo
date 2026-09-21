import { parse } from "yaml";
import { z } from "zod";
import { snippetCompletion, type CompletionContext } from "@codemirror/autocomplete";
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
