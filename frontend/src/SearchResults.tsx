import {
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import React, { useCallback, useContext, useState } from "react";
import { InfolegResult, MermaidResult, Result } from "./search";
import { SearchActionContext } from "./SearchAction";
import { useHotkeys } from "react-hotkeys-hook";
import { SearchResult } from "./search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { FileContext } from "./file";
import Markdown from "./Markdown";

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
  return (
    <ListItem>
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
        code: `###### ${item.criteria}\n${item.text.split('\n').map((x) => `> ${x}`).join('\n')}\n`,
      });
    onDone && onDone();
  }, [callback, item, onDone]);
  useHotkeys("enter", () => selected && add(), { enableOnFormTags: true }, [
    selected,
    add,
  ]);
  return (
    <ListItem>
      <ListItemButton selected={selected} onClick={add}>
        <ListItemText
          primary={<Markdown code={item.text} />}
        />
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
        type: "addCode",
        code: `###### ${item.path}\n${item.text}\n`,
      });
    onDone && onDone();
  }, [callback, item, onDone]);
  useHotkeys("enter", () => selected && add(), { enableOnFormTags: true }, [
    selected,
    add,
  ]);
  return (
    <ListItem
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
          primary={<span style={{ whiteSpace: "pre" }}>{item.text}</span>}
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
    return <p>{error?.message ?? "Unexpected error"}</p>;
  }
  if (value?.length === 0) {
    return <p>No results</p>;
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
