import {
  Alert,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Snackbar,
} from "@mui/material";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { SearchActionContext } from "./SearchAction";
import { useHotkeys } from "react-hotkeys-hook";
import type {
  SearchResult,
  InfolegResult,
  MermaidResult,
  Result,
} from "./search.worker";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { FileContext } from "./file";
import Markdown from "./Markdown";
import "./SearchResults.css";

function MermaidSearchResult({
  item,
  onDone,
  selected,
}: {
  item: MermaidResult;
  onDone?: () => void;
  selected: boolean;
}) {
  const { callback } = useContext(SearchActionContext)!;
  const add = useCallback(() => {
    callback &&
      callback({
        type: "addCode",
        code: "```mermaid\n" + item.text + "\n```\n",
      });
    onDone && onDone();
  }, [callback, item, onDone]);
  useHotkeys("enter", () => selected && add(), { enableOnFormTags: true }, [
    selected,
    add,
  ]);
  const [wasSelected, setWasSelected] = useState(false);
  const ref = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    if (selected !== wasSelected) {
      setWasSelected(selected);
      if (!ref?.current) {
        return;
      }
      ref.current.scrollIntoView();
    }
  }, [selected, wasSelected, ref]);
  return (
    <ListItem ref={ref}>
      <ListItemButton selected={selected} onClick={add}>
        <ListItemText
          primary={<span style={{ whiteSpace: "pre" }}>{item.text}</span>}
        />
      </ListItemButton>
    </ListItem>
  );
}

function InfolegSearchResult({
  item,
  onDone,
  selected,
}: {
  item: InfolegResult;
  onDone?: () => void;
  selected: boolean;
}) {
  const { callback } = useContext(SearchActionContext)!;
  const add = useCallback(() => {
    callback &&
      callback({
        type: "addCode",
        code: `###### ${item.title}\n\n${item.text
          .split("\n")
          .map((x) => `> ${x}`)
          .join("\n")}\n`,
      });
    onDone && onDone();
  }, [callback, item, onDone]);
  useHotkeys("enter", () => selected && add(), { enableOnFormTags: true }, [
    selected,
    add,
  ]);
  const [wasSelected, setWasSelected] = useState(false);
  const ref = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    if (selected !== wasSelected) {
      setWasSelected(selected);
      if (!ref?.current) {
        return;
      }
      ref.current.scrollIntoView();
    }
  }, [selected, wasSelected, ref]);
  return (
    <ListItem ref={ref}>
      <ListItemButton selected={selected} onClick={add}>
        <ListItemText primary={<Markdown code={item.text} />} />
      </ListItemButton>
    </ListItem>
  );
}

function ReactSearchResult({
  item,
  onDone,
  selected,
  repository,
}: {
  item: SearchResult;
  onDone?: () => void;
  selected: boolean;
  repository: { owner: string; name: string } | undefined;
}) {
  const { callback } = useContext(SearchActionContext)!;
  const add = useCallback(() => {
    callback &&
      callback({
        type: "showText",
        starts: item.starts,
        ends: item.ends,
        path: item.path,
        code: item.text,
      });
    onDone && onDone();
  }, [callback, item, onDone]);
  useHotkeys("enter", () => selected && add(), { enableOnFormTags: true }, [
    selected,
    add,
  ]);
  const [wasSelected, setWasSelected] = useState(false);
  const ref = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    if (selected !== wasSelected) {
      setWasSelected(selected);
      if (!ref?.current) {
        return;
      }
      ref.current.scrollIntoView();
    }
  }, [selected, wasSelected, ref]);
  return (
    <ListItem
      ref={ref}
      secondaryAction={
        repository && (
          <IconButton
            edge="end"
            aria-label="open"
            href={`https://github.com/${repository.owner}/${repository.name}/blob/main/documents/${item.path}`}
            target="_blank"
          >
            <OpenInNewIcon />
          </IconButton>
        )
      }
    >
      <ListItemButton selected={selected} onClick={add}>
        <ListItemText
          primary={
            <span style={{ whiteSpace: "pre" }}>
              {item.text.substring(item.starts, item.ends)}
            </span>
          }
        />
      </ListItemButton>
    </ListItem>
  );
}

export default function SearchResults({
  loading,
  error,
  value,
  onDone,
}: {
  loading?: boolean;
  error?: Error;
  value?: Result[];
  onDone?: () => void;
}) {
  const [selected, setSelected] = useState(0);
  useHotkeys(
    "up",
    () => {
      if (value === undefined || value.length === 0) {
        return;
      }
      setSelected((value.length + selected - 1) % value.length);
    },
    { enableOnFormTags: true },
    [selected, value]
  );
  useHotkeys(
    "down",
    () => {
      if (value === undefined || value.length === 0) {
        return;
      }
      setSelected((selected + 1) % value.length);
    },
    { enableOnFormTags: true },
    [selected, value]
  );
  const { file } = useContext(FileContext)!;

  if (loading) {
    return <CircularProgress />;
  }
  if (error) {
    return (
      <Snackbar open={true}>
        <Alert severity="error">{error?.message ?? "Unexpected error"}</Alert>
      </Snackbar>
    );
  }
  if (value?.length === 0) {
    return (
      <List>
        <ListItem>No results</ListItem>
      </List>
    );
  }
  return (
    <List>
      {value?.map((item: Result, index: number) => (
        <React.Fragment key={`${index}`}>
          {item.type === "mermaid" && (
            <MermaidSearchResult
              item={item}
              onDone={onDone}
              selected={index === selected}
            />
          )}
          {item.type === "search" && (
            <ReactSearchResult
              repository={file.repository}
              item={item}
              onDone={onDone}
              selected={index === selected}
            />
          )}
          {item.type === "infoleg" && (
            <InfolegSearchResult
              item={item}
              onDone={onDone}
              selected={index === selected}
            />
          )}
        </React.Fragment>
      )) ?? ""}
    </List>
  );
}
