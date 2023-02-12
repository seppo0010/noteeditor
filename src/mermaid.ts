import { visit } from "unist-util-visit";
import mermaid from "mermaid";
import type { Parent } from "mdast";
import type { Plugin } from "unified";

export interface RemarkMermaidOptions {
  theme?: any;
}

const remarkMermaid: Plugin<
  [RemarkMermaidOptions?],
  any
> = function remarkMermaid({ theme = "default" } = {}) {
  return (ast) => {
    const instances: [string, number, Parent][] = [];
    visit(ast, { type: "code", lang: "mermaid" }, (node, index, parent) => {
      instances.push([node.value, index as number, parent as Parent]);
    });

    // Nothing to do. No need to start puppeteer in this case.
    if (!instances.length) {
      return ast;
    }

    const results = instances.map((ins) => {
      const code = ins[0];
      const id = "mermaid" + Math.random().toString(36).slice(2);
      mermaid.initialize({ theme });
      const div = document.createElement("div");
      try {
        div.innerHTML = `<pre><code class="hljs language-mermaid">${mermaid.render(
          id,
          code
        )}</code></pre>`;
        return div.innerHTML;
      } catch (e) {
        return "Invalid mermaid";
      }
    });

    instances.forEach(([, index, parent], i) => {
      let value = results[i];
      parent.children.splice(index, 1, {
        type: "html",
        value,
      });
    });
  };
};

export default remarkMermaid;
