import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import BaseEditor from "react-simple-code-editor";
import { useHotkeys } from "react-hotkeys-hook";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Popover,
} from "@mui/material";
import { SearchActionContext } from "./SearchAction";

declare type Padding<T> =
  | T
  | {
      top?: T;
      right?: T;
      bottom?: T;
      left?: T;
    };

declare type Props = React.HTMLAttributes<HTMLDivElement> & {
  value: string;
  onValueChange: (value: string) => void;
  highlight: (value: string) => string | React.ReactNode;
  tabSize?: number;
  insertSpaces?: boolean;
  ignoreTabKey?: boolean;
  padding?: Padding<number | string>;
  style?: React.CSSProperties;
  textareaId?: string;
  textareaClassName?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  form?: string;
  maxLength?: number;
  minLength?: number;
  name?: string;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  onClick?: React.MouseEventHandler<HTMLTextAreaElement>;
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  onKeyUp?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  preClassName?: string;
};
const getIcons = (): string[] => {
  const getFa = (rule: CSSRule): string[] => {
    const selector = (rule as CSSStyleRule).selectorText;
    if (!selector) {
      return [];
    }
    const prefix = ".fa-";
    return selector
      .split(",")
      .filter((s) => s.trim().endsWith("::before"))
      .map((s) => s.trim().split("::")[0])
      .filter((s) => s.startsWith(prefix))
      .map((s) => s.substring(1));
  };
  const unique = (value: string, index: number, array: string[]) => {
    return array.indexOf(value) === index;
  };
  return Array.from(document.styleSheets)
    .flatMap((sSheet) => Array.from(sSheet.cssRules).flatMap(getFa))
    .filter(unique);
};

function getOptions(
  value: string,
  index: number
): { show: string; insert: string }[] {
  const word = value.substring(
    value.substring(0, index).lastIndexOf(" ") + 1,
    index
  );
  if (index > 2 && (word === "fa" || word.startsWith("fa-"))) {
    return getIcons()
      .filter((icon) => icon.startsWith(word))
      .map((icon) => ({ show: icon, insert: icon.substring(word.length) }));
  }
  return [];
}

function Option({
  text,
  onClick,
  selected,
}: {
  text: string;
  onClick: () => void;
  selected: boolean;
}) {
  const [wasSelected, setWasSelected] = useState(false);
  const ref = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    if (selected !== wasSelected) {
      setWasSelected(selected);
      if (selected) {
        ref?.current?.scrollIntoView();
      }
    }
  }, [wasSelected, selected]);
  return (
    <ListItem ref={ref}>
      <ListItemButton onClick={onClick} selected={selected}>
        <ListItemText>{text}</ListItemText>
      </ListItemButton>
    </ListItem>
  );
}

export default function Editor(args: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [options, setOptions] = useState<{ show: string; insert: string }[]>(
    []
  );
  const [selectedOption, setSelectedOption] = useState(0);

  const { callback } = useContext(SearchActionContext)!;
  const add = useCallback(
    (code: string) => {
      callback &&
        callback({
          type: "addCode",
          code,
        });
      setPopoverPosition(null);
    },
    [callback, setPopoverPosition]
  );
  const updatePopoverPosition = () => {
    const ta = ref?.current?.getElementsByTagName("textarea")[0];
    if (!ta || ta !== document.activeElement) {
      return;
    }
    const options = getOptions(ta.value, ta.selectionEnd);
    if (options.length === 0) {
      setOptions([]);
      setPopoverPosition(null);
      return;
    }
    setOptions(options);
    const targetNode = document.createElement("pre");
    const styles = window.getComputedStyle(ta);
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
    ta.parentNode?.appendChild(targetNode);
    targetNode.textContent = ta.value;
    const range = document.createRange();
    range.setStart(targetNode.childNodes[0], ta.selectionStart);
    range.setEnd(targetNode.childNodes[0], ta.selectionEnd);
    const { x, y, width, height } = range.getBoundingClientRect();
    setPopoverPosition({
      top: y + height,
      left: x + width,
    });
    targetNode.parentNode?.removeChild(targetNode);
    setSelectedOption(0);
  };
  useHotkeys("ctrl+space", updatePopoverPosition, { enableOnFormTags: true }, [
    ref,
  ]);
  useHotkeys(
    "esc",
    () => {
      setPopoverPosition(null);
    },
    [setPopoverPosition]
  );

  const onKeyDown = (
    ev: React.KeyboardEvent<HTMLDivElement> &
      React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (args?.onKeyDown) args.onKeyDown(ev);
    if (popoverPosition === null) {
      return;
    }
    if (ev.key === "Enter") {
      ev.preventDefault();
      ev.stopPropagation();
      callback &&
        callback({
          type: "addCode",
          code: options[selectedOption].insert,
        });
      setPopoverPosition(null);
    } else if (ev.key === "ArrowDown") {
      ev.preventDefault();
      ev.stopPropagation();
      setSelectedOption((selectedOption + 1) % options.length);
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      ev.stopPropagation();
      setSelectedOption((selectedOption - 1) % options.length);
    } else if (ev.key === "Escape") {
      setPopoverPosition(null);
    } else {
      setTimeout(updatePopoverPosition);
    }
  };
  return (
    <div ref={ref} style={{ minHeight: "100%" }}>
      <BaseEditor onKeyDown={onKeyDown} {...args} />

      <Popover
        open={popoverPosition !== null}
        onClose={() => setPopoverPosition(null)}
        anchorReference="anchorPosition"
        anchorPosition={popoverPosition ?? { left: 0, top: 0 }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        disableAutoFocus={true}
        disableEnforceFocus={true}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <List>
          {options.slice(0, 20).map(({ show, insert }, i) => (
            <Option
              text={show}
              onClick={() => add(insert)}
              selected={i === selectedOption}
              key={show}
            />
          ))}
        </List>
      </Popover>
    </div>
  );
}
