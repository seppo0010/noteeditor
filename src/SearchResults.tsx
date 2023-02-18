import {
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { useContext } from "react";
import { MermaidResult, Result } from "./search";
import { SearchActionContext } from "./SearchAction";

function MermaidSearchResult({
  item,
  onDone,
}: {
  item: MermaidResult;
  onDone?: () => void;
}) {
  const { pending, setPending } = useContext(SearchActionContext);
  return (
    <ListItemButton
      onClick={() => {
        setPending({
          ...pending,
          actions: [
            ...pending.actions,
            {
              type: "addCode",
              code: item.text,
            },
          ],
        });
        onDone && onDone();
      }}
    >
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
            <MermaidSearchResult item={item} onDone={onDone} />
          )}
        </ListItem>
      )) ?? ""}
    </List>
  );
}
