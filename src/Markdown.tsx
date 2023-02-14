import React from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import remarkMermaidPlugin from "./mermaid";
import { VFile } from "vfile";
import { useAsync } from "react-use";
import { html } from "property-information";
import { childrenToReact } from "./ast-to-react";

/*
const processor = unified()
.use(remarkParse)
.use(options.remarkPlugins || [])
.use(remarkRehype, {
  ...options.remarkRehypeOptions,
  allowDangerousHtml: true
})
.use(options.rehypePlugins || [])
.use(rehypeFilter, options)
*/
const processor = unified()
  .use(remarkParse)
  .use([remarkMermaidPlugin])
  .use(remarkRehype, { allowDangerousHtml: true })
  .use([rehypeRaw]);

export default function Markdown({ code }: { code: string }): JSX.Element {
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
  console.log({ value });
  return React.createElement(
    React.Fragment,
    {},
    childrenToReact({ options: {}, schema: html, listDepth: 0 }, value)
  );
}
