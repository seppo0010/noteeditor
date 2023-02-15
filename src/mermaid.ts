import { visit } from "unist-util-visit";
import mermaid from "mermaid";
import type { Pluggable } from "unified";
import mindmap from "@mermaid-js/mermaid-mindmap";

export interface RemarkMermaidOptions {}

//declare const remarkParse: Plugin<[Options?] | void[], string, Root>
const remarkMermaid: Pluggable = function remarkMermaid() {
  return (ast, file, next) => {
    const promises: Promise<any>[] = [];
    console.log(ast);
    visit(ast, { type: "code", lang: "mermaid" }, (node, index, parent) => {
      const code = `${node.value}`.trim();
      const id = "mermaid" + Math.random().toString(36).slice(2);
      promises.push(
        mermaid
          .renderAsync(id, code)
          .catch((e) => `Invalid mermaid:\n${e}`)
          .then((value) =>
            parent.children.splice(index, 1, {
              type: "html",
              value,
            })
          )
      );
    });
    Promise.all(promises).then(() => next());
  };
};

mermaid.initialize({});
mermaid.registerExternalDiagrams([mindmap]);
export default remarkMermaid;
