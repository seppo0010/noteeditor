import { useCallback, useContext, useEffect, useRef, useState } from "react";
import "./App.css";
import Editor from "./Editor";
import { languages, highlight } from "prismjs";
import "prismjs/components/prism-markdown";
import "prismjs/themes/prism.css";
import Markdown from "./Markdown";
import { cloneContent, Content, contentsAreEqual, FileContext } from "./file";
import { Action, ActionContext } from "./Action";
import { useHotkeys } from "react-hotkeys-hook";
import { Octokit } from "@octokit/rest";
import { UserContext } from "./user";
import { Alert, AlertColor, Box, Button, Modal, Snackbar } from "@mui/material";
import { useDebounce } from "react-use";

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
  const { user } = useContext(UserContext)!;
  const { file, content, setContent, setSaving } = useContext(FileContext)!;
  const { setCallback } = useContext(ActionContext)!;
  const [code, setCode] = useState("");
  const [loadedContent, setLoadedContent] = useState<Content | null>(null);
  useEffect(() => {
    if (user.loggedIn === undefined) {
      setCode(defaultCode);
      return;
    }
    if (
      content !== null &&
      (loadedContent === null || !contentsAreEqual(content, loadedContent)) &&
      !content.innerContent.loading
    ) {
      setLoadedContent(cloneContent(content));
      setCode(content.innerContent.text ?? "");
    }
  }, [user, content, loadedContent]);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const positioningRef = useRef<HTMLPreElement | null>(null);
  const showTextRef = useRef<HTMLDivElement | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    severity: AlertColor;
    autoHideDuration?: number;
  } | null>(null);
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [showText, setShowText] = useState<{
    path: string;
    code: string;
    starts: number;
    ends: number;
  } | null>(null);

  const getTextarea = useCallback((): HTMLTextAreaElement | undefined => {
    return editorRef.current?.getElementsByTagName("textarea")[0];
  }, [editorRef]);

  useHotkeys(
    "esc",
    () => {
      setShowText(null);
      getTextarea()?.focus();
    },
    { enableOnFormTags: true },
    [editorRef, setShowText, getTextarea, editorRef]
  );

  const save = useCallback(async () => {
    if (
      loadedContent &&
      file.repository &&
      code !== loadedContent.innerContent.text
    ) {
      setSaving(true);
      const octokit = new Octokit({ auth: user.loggedIn?.auth });
      try {
        const {
          data: { content },
        } = await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
          owner: file.repository.owner,
          repo: file.repository.name,
          path: loadedContent.path,
          message: "changes",
          content: Buffer.from(code, "binary").toString("base64"),
          sha: loadedContent.innerContent.sha,
        });
        setLoadedContent({
          path: loadedContent.path,
          innerContent: {
            loading: false,
            text: code,
            sha: content!.sha!,
          },
        });
        setContent({
          path: loadedContent.path,
          innerContent: {
            loading: false,
            text: code,
            sha: content!.sha!,
          },
        });
        setMessage({
          text: "Changes saved",
          severity: "success",
          autoHideDuration: 1000,
        });
        setShowMessage(true);
      } catch (e: unknown) {
        const err = e as { message?: string };
        setMessage({
          text: "Error saving" + (err?.message ? `: ${err.message}` : ""),
          severity: "error",
        });
        setShowMessage(true);
      } finally {
        setSaving(false);
      }
    }
  }, [
    user,
    loadedContent,
    code,
    file,
    setLoadedContent,
    setContent,
    setSaving,
  ]);

  const myCallback = useCallback(
    (action: Action) => {
      if (action.type === "addCode") {
        const textarea = getTextarea()!;
        const newCode =
          code.substring(0, textarea.selectionStart ?? 0) +
          action.code +
          code.substring(textarea.selectionEnd ?? 0);
        const selectionStart = textarea.selectionStart;
        // this is needed only to keep the cursor in the desired position
        textarea.value = newCode;
        setTimeout(() => {
          textarea.setSelectionRange(
            selectionStart + action.code.length,
            selectionStart + action.code.length
          );
          textarea.focus();
        });
        setCode(newCode);
      }
      if (action.type === "showText") {
        setShowText({ ...action });
      }
      if (action.type === "save") {
        save();
      }
      if (action.type === "pdf") {
        window.print();
      }
    },
    [code, getTextarea, save]
  );

  useEffect(() => {
    setCallback(() => myCallback);
  }, [myCallback, setCallback]);

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

  useEffect(() => {
    const tss = showTextRef?.current?.getElementsByTagName("textarea");
    if (tss && tss.length > 0) {
      const ts = tss[0];
      if (showText) {
        ts.value = showText.code;
        ts.setSelectionRange(showText.starts, showText.ends);
        setTimeout(() => ts.focus());
      }
    }
  }, [showText, showTextRef]);

  useEffect(() => {
    if (!loadedContent?.path) {
      return;
    }
    const timeout = setTimeout(save, 30000);
    return () => clearTimeout(timeout);
  }, [save, user, loadedContent, code, file, setLoadedContent, setContent]);
  useHotkeys(
    "meta+s, ctrl+s",
    (keyboardEvent: KeyboardEvent) => {
      keyboardEvent.preventDefault();
      save();
    },
    { enableOnFormTags: true },
    [save, user, loadedContent, code, file, setLoadedContent, setContent]
  );
  const insertShowText = () => {
    if (showText === null) {
      return;
    }
    const insertTextarea = showTextRef.current?.getElementsByTagName(
      "textarea"
    )[0];
    if (!insertTextarea) {
      return;
    }
    myCallback({
      type: "addCode",
      code: `###### ${showText.path}\n\n${insertTextarea.value
        .substring(insertTextarea.selectionStart, insertTextarea.selectionEnd)
        .split("\n")
        .map((x) => `> ${x}`)
        .join("\n")}\n`,
    });
    setShowText(null);
  };
  useHotkeys(
    "meta+enter, ctrl+enter",
    insertShowText,
    { enableOnFormTags: true },
    [showText, setShowText, myCallback, showTextRef, myCallback]
  );

  const [debounceCode, setDebounceCode] = useState("");
  useDebounce(
    () => {
      setDebounceCode(code);
    },
    2000,
    [setDebounceCode, code]
  );

  return (
    <div id="app" style={{ position: "relative" }}>
      <div id="editor" ref={editorRef}>
        <pre ref={positioningRef}>{code}</pre>
        <Editor
          value={code}
          onValueChange={(code) => setCode(code)}
          highlight={(code) => highlight(code, languages.markdown, "md")}
          style={{ height: "100%" }}
          padding={10}
        />
      </div>
      <div id="preview" ref={previewRef}>
        <Markdown code={debounceCode} positioningEl={positioningRef?.current} />
      </div>
      <Snackbar
        autoHideDuration={message?.autoHideDuration}
        open={message !== null && showMessage}
        onClose={() => setShowMessage(false)}
      >
        <Alert severity={message?.severity ?? "error"}>
          {message?.text ?? "Something happened"}
        </Alert>
      </Snackbar>
      <Modal
        open={showText !== null}
        onClose={() => setShowText(null)}
        disablePortal
        ref={showTextRef}
      >
        <Box
          sx={{
            width: "80vw",
            margin: "10vh 10vw",
            height: "80vh",
            background: "white",
          }}
        >
          Select text to insert
          <textarea
            value={showText?.code ?? ""}
            onChange={() => {}}
            style={{
              width: "calc(100% - 20px)",
              height: "calc(100% - 64px)",
              overflow: "auto",
              padding: 10,
              border: 0,
              margin: 0,
            }}
          />
          <Button title="ctrl+enter/cmd+enter" onClick={insertShowText}>
            Insert
          </Button>
          <Button title="esc" onClick={() => setShowText(null)}>
            Cancel
          </Button>
        </Box>
      </Modal>
    </div>
  );
}
