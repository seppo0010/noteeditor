import {
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { useCallback, useContext, useState } from "react";
import { MermaidResult, Result } from "./search";
import { SearchActionContext } from "./SearchAction";
import { useHotkeys } from "react-hotkeys-hook";

function MermaidSearchResult({
  item,
  onDone,
  selected,
}: {
  item: MermaidResult;
  onDone?: () => void;
  selected: boolean;
}) {
  const { pending, setPending } = useContext(SearchActionContext);
  const add = useCallback(() => {
    setPending({
      ...pending,
      actions: [
        ...pending.actions,
        {
          type: "addCode",
          code: "```mermaid\n" + item.text + "\n```\n",
        },
      ],
    });
    onDone && onDone();
  }, [pending, item, onDone, setPending]);
  useHotkeys("enter", () => selected && add(), { enableOnFormTags: true }, [
    add,
  ]);
  return (
    <ListItemButton selected={selected} onClick={add}>
      <ListItemText
        primary={<span style={{ whiteSpace: "pre" }}>{item.text}</span>}
      />
    </ListItemButton>
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
      console.log({ selected, value });
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
        <ListItem key={`${index}`}>
          {item.type === "mermaid" && (
            <MermaidSearchResult
              item={item}
              onDone={onDone}
              selected={index === selected}
            />
          )}
        </ListItem>
      )) ?? ""}
    </List>
  );
}
