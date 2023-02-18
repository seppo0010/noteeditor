import { useCallback, useContext, useEffect, useState } from "react";
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
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Input,
  Alert,
  List,
} from "@mui/material";
import { Octokit } from "@octokit/rest";
import { FileContext } from "./file";
import { UserContext, UserOpt } from "./user";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { useAsync } from "react-use";
import * as pdfjsLib from "pdfjs-dist";
import { TextItem, TextMarkedContent } from "pdfjs-dist/types/src/display/api";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.3.122/pdf.worker.js";

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

async function readPDFFile(f: File): Promise<string> {
  const loadingTask = pdfjsLib.getDocument(
    new Uint8Array(await f.arrayBuffer())
  );
  const pdf = await loadingTask.promise;
  const texts = await Promise.all(
    Array.from({ length: pdf.numPages }, (x, i) =>
      pdf.getPage(i + 1).then(async (page) => {
        const texts = await page.getTextContent();
        return texts.items
          .map((item: TextItem | TextMarkedContent) => {
            if (!item.hasOwnProperty("str")) {
              return "";
            }
            const textItem = item as TextItem;
            return textItem.str + (textItem.hasEOL ? "\n" : "");
          })
          .join("");
      })
    )
  );
  return texts.join("\n");
}

async function readFile(f: File): Promise<string | null> {
  if (f.type === "application/pdf") return readPDFFile(f);
  if (f.type === "text/plain") return f.text();
  return null;
}

function UploadDocument({
  open,
  handleClose,
}: {
  open: boolean;
  handleClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [files, setFiles] = useState<
    { file: File; content: string | null }[] | null
  >(null);
  const addFiles = async (files: FileList) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      setFiles(
        await Promise.all(
          Array.from(files).map(async (file: File) => ({
            file,
            content: await readFile(file),
          }))
        )
      );
    } catch (err: unknown) {
      const error = err as { message?: string } | undefined;
      setErrorMessage(error?.message ?? "Unexpected error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Upload Document</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Uploading a document will keep it for reference and add its contents
          to the search bar.
        </DialogContentText>
        <Input
          style={{ display: "none" }}
          id="upload-document-file"
          componentsProps={{ input: { multiple: true } }}
          type="file"
          onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
            if (ev.target.files) {
              addFiles(ev.target.files);
            }
          }}
        />
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        <label htmlFor="upload-document-file">
          <Button variant="contained" component="span">
            Upload
          </Button>
        </label>
        {loading && <CircularProgress />}
        {files && (
          <List>
            {files.map(({ file, content }, i) => (
              <ListItem key={`${i}`}>
                <ListItemButton
                  title={
                    (content?.substring(0, 200) ?? "") +
                    ((content?.length ?? 0) > 200 ? "..." : "")
                  }
                >
                  {file.name}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleClose}>Done</Button>
      </DialogActions>
    </Dialog>
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

  const [uploadDocumentOpen, setUploadDocumentOpen] = useState(false);
  const handleUploadDocumentClose = useCallback(() => {
    setUploadDocumentOpen(false);
  }, [setUploadDocumentOpen]);

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
      <ListItem>
        <ListItemButton onClick={() => setUploadDocumentOpen(true)}>
          <ListItemIcon>
            <AddIcon />
          </ListItemIcon>
          <ListItemText primary="Upload document" />
        </ListItemButton>
        <UploadDocument
          open={uploadDocumentOpen}
          handleClose={handleUploadDocumentClose}
        />
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
