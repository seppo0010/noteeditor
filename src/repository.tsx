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
  ListItem,
  CircularProgress,
} from "@mui/material";
import { Octokit } from "@octokit/rest";
import { FileContext } from "./file";
import { UserContext, UserOpt } from "./user";
import EditIcon from "@mui/icons-material/Edit";
import { useAsync } from "react-use";

interface Repo {
  owner: string;
  name: string;
}

function PickRepository({
  onDone,
  user,
}: {
  user: UserOpt;
  onDone: () => void;
}) {
  const { file, setFile } = useContext(FileContext)!;
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

function Tree({
  loading,
  error,
  value,
  onPath,
}: {
  loading: boolean;
  error?: Error;
  value?: { path: string }[];
  onPath: (path: string) => void;
}) {
  if (loading) {
    return <CircularProgress />;
  }
  if (error) {
    return <>{error?.message ?? "Unexpected error"}</>;
  }
  return (
    <>
      {(value || []).map(({ path }) => (
        <ListItem
          key={path}
          onClick={() => {
            onPath(path);
          }}
        >
          <ListItemText primary={path} />
        </ListItem>
      ))}
    </>
  );
}

export function Repository({ onClose }: { onClose: () => void }) {
  const { file, setFile } = useContext(FileContext)!;
  const { user } = useContext(UserContext)!;
  const treeState = useAsync(async () => {
    if (!file.repository || !user.loggedIn) return;
    const octokit = new Octokit({ auth: user.loggedIn?.auth });
    const [owner, repo] = [file.repository.owner, file.repository.name];
    const {
      data: { default_branch },
    } = await octokit.repos.get({ owner, repo });
    const branch = await octokit.request(
      "GET /repos/{owner}/{repo}/branches/{branch}",
      {
        owner,
        repo,
        branch: default_branch,
      }
    );
    const {
      data: { tree },
    } = await octokit.request(
      "GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=true",
      {
        owner,
        repo,
        tree_sha: branch.data.commit.sha,
      }
    );
    return tree.filter(({ type }: { type: unknown }) => type === "blob");
  }, [file, user]);

  const [change, setChange] = useState(false);
  if (change) {
    return <PickRepository onDone={() => setChange(false)} user={user} />;
  }

  return (
    <>
      <ListItem>
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
      </ListItem>
      <Tree
        {...treeState}
        onPath={(path: string) => {
          setFile({ ...file, path });
          onClose();
        }}
      />
    </>
  );
}
