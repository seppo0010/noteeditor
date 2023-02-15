import React from "react";
import { Pluggable, unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import remarkMermaidPlugin from "./mermaid";
import { VFile } from "vfile";
import { useAsync } from "react-use";
import { html } from "property-information";
import { childrenToReact } from "./ast-to-react";

interface Node {
  children?: Node[];
  position: { start: { offset: number }, end: { offset: number }};
  data?: { hProperties?: Record<string, unknown> };
}

const addBoundingBox = function (positionEl: HTMLPreElement | null): Pluggable {
  const addPositionRecursively = (node: Node) => {
    const range = document.createRange();
    range.setStart(positionEl!.childNodes[0], node.position.start.offset);
    range.setEnd(positionEl!.childNodes[0], node.position.end.offset);
    node.data = node.data ?? {}
    node.data.hProperties = node.data.hProperties ?? {}
    const rect = range.getBoundingClientRect();
    node.data.hProperties['data-top'] = rect.top;
    node.data.hProperties['data-height'] = rect.height;
    node.children?.forEach((child: Node) => addPositionRecursively(child));
  }
  return () => {
    return (ast: Node, file, next) => {
      if (positionEl) {
        addPositionRecursively(ast);
      }
      next();
    };
  }
}

export default function Markdown({ code, positioningEl }: { code: string, positioningEl: HTMLPreElement | null }): JSX.Element {
  const processor = unified()
    .use(remarkParse)
    .use([addBoundingBox(positioningEl)])
    .use([remarkMermaidPlugin])
    .use(remarkRehype, { allowDangerousHtml: true })
    .use([rehypeRaw]);

  const { value, loading, error } = useAsync(async () => {
    const file = new VFile();
    file.value = code;
    return await processor.run(processor.parse(file), file);
  }, [code]);
  if (loading) {
    return <>Loading...</>;
  }
  if (error) {
    return <>Error: ${error.message}</>;
  }
  if (!value) {
    return <>Unexpected...</>;
  }
  return React.createElement(
    React.Fragment,
    {},
    childrenToReact({ options: {}, schema: html, listDepth: 0 }, value)
  );
}
