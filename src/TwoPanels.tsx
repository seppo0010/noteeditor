import { useContext, useEffect, useRef, useState } from "react";
import "./App.css";
import Editor from "react-simple-code-editor";
import { languages, highlight } from "prismjs";
import "prismjs/components/prism-markdown";
import "prismjs/themes/prism.css";
import Markdown from "./Markdown";
import { cloneContent, Content, contentsAreEqual, FileContext } from "./file";

const defaultCode = `
# Hello world

This is some sample text

## Subtitle

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla felis
felis, pretium eget porttitor et, eleifend molestie leo. Sed efficitur
iaculis justo. Cras tempus magna vel velit rutrum egestas. Nam ut est
augue. Fusce felis velit, convallis at dictum sed, maximus a purus.
Etiam quis commodo velit. Nam dictum, lectus nec sollicitudin elementum,
eros enim porta orci, sit amet sodales urna nunc sed nisl. Vivamus nec
pellentesque diam. 

1. item a
2. item b

\`\`\`mermaid
mindmap
root((mindmap))
    Origins
    Long history
    ::icon(fa fa-book)
    Popularisation
        British popular psychology author Tony Buzan
    Research
    On effectiveness<br/>and features
    On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
    Pen and paper
    Mermaid
\`\`\`
`;
export default function TwoPanels() {
  const { content } = useContext(FileContext)!;
  const [code, setCode] = useState(defaultCode);
  const [loadedContent, setLoadedContent] = useState<Content | null>(null);
  useEffect(() => {
    if (
      content !== null &&
      (loadedContent === null || !contentsAreEqual(content, loadedContent))
    ) {
      setLoadedContent(cloneContent(content));
      setCode(content.innerContent.text ?? "");
    }
  }, [content, loadedContent]);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!editorRef?.current || !previewRef?.current) {
      return;
    }
    const editorEl = editorRef.current;
    const previewEl = previewRef.current;
    const onscroll = (event: Event) => { console.log(editorEl.scrollTop, previewEl.scrollTop) }
    editorEl.addEventListener('scroll', onscroll);
    previewEl.addEventListener('scroll', onscroll);
    return () => {
      editorEl.removeEventListener('scroll', onscroll);
      previewEl.removeEventListener('scroll', onscroll);
    };
  }, [editorRef, previewRef])
  return (
    <div id="app">
      <div id="editor" ref={editorRef}>
        <Editor
          value={code}
          onValueChange={(code) => setCode(code)}
          highlight={(code) => highlight(code, languages.markdown, "md")}
          padding={10}
        />
      </div>
      <div id="preview" ref={previewRef}>
        <Markdown code={code} />
      </div>
    </div>
  );
}