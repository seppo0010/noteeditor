import { useContext, useEffect, useState } from "react";
import "./App.css";
import "prismjs/components/prism-markdown";
import "prismjs/themes/prism.css";
import {
  TextField,
  Autocomplete,
  ListItemButton,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import { Octokit } from "@octokit/rest";
import { FileContext } from "./file";
import { UserContext } from "./user";
import EditIcon from "@mui/icons-material/Edit";

interface Repo {
  owner: string;
  name: string;
}

function PickRepository({ onDone }: { onDone: () => void }) {
  const userContext = useContext(UserContext);
  if (userContext === null) {
    throw new Error("null user context");
  }
  const { user } = userContext;
  const fileContext = useContext(FileContext);
  if (fileContext === null) {
    throw new Error("null file context");
  }
  const { file, setFile } = fileContext;
  const [repositories, setRepositories] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  useEffect(() => {
    if (!user.loggedIn) return;
    (async () => {
      setLoadingRepos(true);
      const octokit = new Octokit({ auth: user.loggedIn?.auth });
      setRepositories(
        (await octokit.paginate("GET /user/repos")).map((repo) => ({
          owner: repo.owner.login,
          name: repo.name,
        }))
      );
      setLoadingRepos(false);
    })();
  }, [user]);
  const [repositoryInputValue, setRepositoryInputValue] = useState("");
  if (!user.loggedIn) {
    return <></>;
  }
  if (loadingRepos) {
    return <>Loading...</>;
  }
  return (
    <Autocomplete
      getOptionLabel={(option) => `${option.owner}/${option.name}`}
      disablePortal
      options={repositories}
      value={file.repository}
      inputValue={repositoryInputValue}
      onInputChange={(event, newInputValue) => {
        setRepositoryInputValue(newInputValue);
      }}
      isOptionEqualToValue={(option, value) =>
        option.name === value.name && option.owner === value.owner
      }
      onChange={(event, newValue: Repo | null) => {
        setFile({
          ...file,
          repository: newValue === null ? undefined : newValue,
        });
        onDone();
      }}
      fullWidth
      renderInput={(params: any) => (
        <TextField {...params} label="Repository" />
      )}
    />
  );
}

export function Repository() {
  const fileContext = useContext(FileContext);
  if (fileContext === null) {
    throw new Error("null file context");
  }
  const { file } = fileContext;
  const [change, setChange] = useState(false);
  if (change) {
    return <PickRepository onDone={() => setChange(false)} />;
  }
  return (
    <ListItemButton onClick={() => setChange(true)}>
      <ListItemIcon>
        <EditIcon />
      </ListItemIcon>
      <ListItemText
        primary={
          file.repository
            ? `${file.repository.owner}/${file.repository.name}`
            : "No repository selected"
        }
      />
    </ListItemButton>
  );
}
