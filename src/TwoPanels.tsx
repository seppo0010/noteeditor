import { useContext, useEffect, useRef, useState } from "react";
import "./App.css";
import Editor from "react-simple-code-editor";
import { languages, highlight } from "prismjs";
import "prismjs/components/prism-markdown";
import "prismjs/themes/prism.css";
import Markdown from "./Markdown";
import { cloneContent, Content, contentsAreEqual, FileContext } from "./file";
import { SearchActionContext } from "./SearchAction";
import { useHotkeys } from "react-hotkeys-hook";

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
  const { pending, setPending } = useContext(SearchActionContext);
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
  const positioningRef = useRef<HTMLPreElement | null>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  useHotkeys(
    "esc",
    () => {
      const textarea:
        | HTMLTextAreaElement
        | undefined = editorRef?.current?.getElementsByTagName("textarea")[0];
      textarea?.focus();
    },
    { enableOnFormTags: true },
    [editorRef]
  );

  useEffect(() => {
    if (pending.actions.length > 0 && pending.actions[0].type === "addCode") {
      const action = pending.actions[0];
      const newCode =
        code.substring(0, selectionStart) +
        action.code +
        code.substring(selectionEnd);
      const textarea: HTMLTextAreaElement = editorRef!.current!.getElementsByTagName(
        "textarea"
      )[0];
      // this is needed only to keep the cursor in the desired position
      textarea.value = newCode;
      textarea.setSelectionRange(
        selectionStart + action.code.length,
        selectionStart + action.code.length
      );
      textarea.focus();
      setCode(newCode);
      setPending({
        ...pending,
        actions: pending.actions.slice(1),
      });
    }
  }, [pending, code, selectionEnd, selectionStart, setPending, editorRef]);
  useEffect(() => {
    if (!editorRef?.current || !previewRef?.current) {
      return;
    }
    const editorEl = editorRef.current;
    const previewEl = previewRef.current;
    let scrolling: "editor" | "preview" | null = null;
    let resetScrolling: any;
    const onscrollPreview = (event: Event) => {
      if (scrolling === "editor") {
        return;
      }
      const middle = previewEl.scrollTop + previewEl.offsetHeight / 2;
      const closestEl = (Array.from(
        previewEl.children
      ) as Array<HTMLElement>).find((el: HTMLElement) => {
        const [top, height] = [el.offsetTop, el.offsetHeight];
        const [editorTop, editorHeight] = [
          parseFloat(el.getAttribute("data-top") ?? "Infinity"),
          parseFloat(el.getAttribute("data-height") ?? "Infinity"),
        ];
        return (
          editorTop !== Infinity &&
          editorHeight !== Infinity &&
          middle < top + height
        );
      });
      if (!closestEl) {
        return;
      }
      const [editorTop, editorHeight] = [
        parseFloat(closestEl.getAttribute("data-top") ?? "Infinity"),
        parseFloat(closestEl.getAttribute("data-height") ?? "Infinity"),
      ];
      const relPos = (middle - closestEl.offsetTop) / closestEl.offsetHeight;
      const top =
        editorTop + relPos * editorHeight - previewEl.offsetHeight / 2;
      if (Math.abs(top - editorEl.scrollTop) < 20) {
        return;
      }
      scrolling = "preview";
      editorEl.scrollTo({
        behavior: "smooth",
        top,
      });
      clearTimeout(resetScrolling);
      resetScrolling = setTimeout(() => {
        scrolling = null;
      }, 1000);
    };
    const onscrollEditor = (event: Event) => {
      if (scrolling === "preview") {
        return;
      }
      const middle = editorEl.scrollTop + editorEl.offsetHeight / 2;
      const closestEl = (Array.from(
        previewEl.children
      ) as Array<HTMLElement>).find((el: HTMLElement) => {
        const [editorTop, editorHeight] = [
          parseFloat(el.getAttribute("data-top") ?? "Infinity"),
          parseFloat(el.getAttribute("data-height") ?? "Infinity"),
        ];
        return (
          editorTop !== Infinity &&
          editorHeight !== Infinity &&
          middle < editorTop + editorHeight
        );
      });
      if (!closestEl) {
        return;
      }
      const [editorTop, editorHeight] = [
        parseFloat(closestEl.getAttribute("data-top") ?? "Infinity"),
        parseFloat(closestEl.getAttribute("data-height") ?? "Infinity"),
      ];
      const relPos = (middle - editorTop) / editorHeight;
      const top =
        closestEl.offsetTop +
        relPos * closestEl.offsetHeight -
        previewEl.offsetHeight / 2;
      if (Math.abs(top - previewEl.scrollTop) < 20) {
        return;
      }
      scrolling = "editor";
      previewEl.scrollTo({
        behavior: "auto",
        top,
      });
      clearTimeout(resetScrolling);
      resetScrolling = setTimeout(() => {
        scrolling = null;
      }, 1000);
    };
    editorEl.addEventListener("scroll", onscrollEditor);
    previewEl.addEventListener("scroll", onscrollPreview);
    return () => {
      editorEl.removeEventListener("scroll", onscrollEditor);
      previewEl.removeEventListener("scroll", onscrollPreview);
    };
  }, [editorRef, previewRef]);

  useEffect(() => {
    if (!editorRef?.current || !positioningRef?.current) {
      return;
    }
    var targetNode = positioningRef.current;
    const styles = window.getComputedStyle(
      editorRef.current.getElementsByTagName("textarea")[0]
    );
    if (styles.cssText !== "") {
      targetNode.style.cssText = styles.cssText;
    } else {
      const cssText = Object.values(styles).reduce(
        (css, propertyName) =>
          `${css}${propertyName}:${styles.getPropertyValue(propertyName)};`
      );
      targetNode.style.cssText = cssText;
    }
    targetNode.style.visibility = "hidden";
    targetNode.style.position = "absolute";
    targetNode.style.top = "0";
    targetNode.style.left = "0";
  }, [editorRef, positioningRef]);

  return (
    <div id="app" style={{ position: "relative" }}>
      <div id="editor" ref={editorRef}>
        <pre ref={positioningRef}>{code}</pre>
        <Editor
          value={code}
          onValueChange={(code) => setCode(code)}
          highlight={(code) => highlight(code, languages.markdown, "md")}
          onBlur={(event) => {
            setSelectionStart(
              (event.target as HTMLTextAreaElement).selectionStart
            );
            setSelectionEnd((event.target as HTMLTextAreaElement).selectionEnd);
          }}
          padding={10}
        />
      </div>
      <div id="preview" ref={previewRef}>
        <Markdown code={code} positioningEl={positioningRef?.current} />
      </div>
    </div>
  );
}
