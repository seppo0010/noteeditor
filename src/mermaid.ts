import { visit } from "unist-util-visit";
import mermaid from "mermaid";
import type { Plugin } from "unified";

export interface RemarkMermaidOptions {
  theme?: any;
}

const remarkMermaid: Plugin<
  [RemarkMermaidOptions?],
  any
> = function remarkMermaid({ theme = "default" } = {}) {
  return (ast) => {
    visit(ast, { type: "code", lang: "mermaid" }, (node, index, parent) => {
      const code = node.value;
      const id = "mermaid" + Math.random().toString(36).slice(2);
      mermaid.initialize({ theme });
      let value;
      try {
        value = mermaid.render(
          id,
          code
        );
      } catch (e) {
        value = `Invalid mermaid:\n${e}`;
      }
      parent.children.splice(index, 1, {
        type: "html",
        value,
      });
    });
  };
};

export default remarkMermaid;
