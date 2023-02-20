import { Octokit } from "@octokit/rest";
import {
  ReactNode,
  useState,
  useEffect,
  SetStateAction,
  createContext,
  Dispatch,
  useContext,
} from "react";
import { SearchContext } from "./SearchProvider";
import { UserContext } from "./user";
// eslint-disable-next-line import/no-webpack-loader-syntax
const Worker = require("workerize-loader!./search.worker");

export interface FileProviderInterface {
  children: ReactNode[] | ReactNode;
}

export interface FileOpt {
  repository?: {
    owner: string;
    name: string;
  };
  path?: string;
}

const decode = (str: string): string =>
  Buffer.from(str, "base64").toString("utf-8");

export interface Content {
  path: string;
  innerContent:
    | { loading: true; text?: undefined; sha?: undefined }
    | { loading: false; text: string; sha: string };
}

export function contentsAreEqual(c1: Content, c2: Content): boolean {
  return (
    c1.path === c2.path &&
    c1.innerContent.loading === c2.innerContent.loading &&
    c1.innerContent?.text === c2.innerContent?.text &&
    c1.innerContent?.sha === c2.innerContent?.sha
  );
}

export function cloneContent({
  path,
  innerContent: { loading, text, sha },
}: Content): Content {
  return {
    path,
    innerContent: {
      loading,
      text,
      sha,
    },
  } as Content;
}

export interface FileContextInterface {
  file: FileOpt;
  setFile: Dispatch<SetStateAction<FileOpt>>;
  content: Content | null;
  setContent: Dispatch<SetStateAction<Content | null>>;
}

export const FileContext = createContext<FileContextInterface | null>(null);

export const FileProvider = ({ children }: FileProviderInterface) => {
  const [file, setFile] = useState<FileOpt>(
    JSON.parse(localStorage.getItem("file") ?? "{}")
  );

  const { user } = useContext(UserContext)!;
  const { search } = useContext(SearchContext)!;
  const [content, setContent] = useState<Content | null>(null);

  useEffect(() => {
    const auth = user.loggedIn?.auth;
    if (!auth) {
      throw new Error("No user context");
    }
    if (!file.repository) {
      throw new Error("selecting path but no context was set");
    }
    if (file.path !== content?.path) {
      if (file.path) {
        setContent({
          path: file.path,
          innerContent: { loading: true },
        });
        (async () => {
          const octokit = new Octokit({ auth });
          const { data } = await octokit.request(
            "GET /repos/{owner}/{repo}/contents/{path}",
            {
              owner: file.repository!.owner,
              repo: file.repository!.name,
              path: file.path!,
            }
          );
          if ((data as { type?: unknown })?.type !== "file") {
            throw new Error(`Unexpected type ${JSON.stringify(data)}`);
          }
          if ((data as { encoding?: unknown })?.encoding !== "base64") {
            throw new Error(`Unexpected encoding ${JSON.stringify(data)}`);
          }
          const text = decode((data as { content: string }).content);
          setContent({
            path: file.path!,
            innerContent: {
              loading: false,
              text,
              sha: (data as { sha: string }).sha,
            },
          });
        })();
      } else {
        setContent(null);
      }
    }
  }, [content?.path, file, user]);

  useEffect(() => {
    const auth = user.loggedIn?.auth;
    if (!auth) {
      throw new Error("No user context");
    }
    (async () => {
      const { repository } = file;
      if (!repository) {
        search.searchWorker.setMiniSearchData(null);
        return;
      }

      const octokit = new Octokit({ auth });
      try {
        const { data } = await octokit.request(
          "GET /repos/{owner}/{repo}/contents/{path}",
          {
            owner: repository.owner,
            repo: repository.name,
            path: "minisearch.json",
          }
        );
        if ((data as { type?: unknown })?.type !== "file") {
          throw new Error(`Unexpected type ${JSON.stringify(data)}`);
        }
        if ((data as { encoding?: unknown })?.encoding !== "base64") {
          throw new Error(`Unexpected encoding ${JSON.stringify(data)}`);
        }
        const text = decode((data as { content: string }).content);
        search.searchWorker.setMiniSearchData(text);
      } catch (e) {
        if ((e as undefined | { message?: string })?.message === "Not Found") {
          search.searchWorker.setMiniSearchData(null);
        } else {
          console.error({ e });
        }
      }
    })();
  }, [file, user, search]);

  useEffect(() => {
    if (file) {
      localStorage.setItem("file", JSON.stringify(file));
    }
  }, [file]);

  return (
    <FileContext.Provider value={{ file, setFile, content, setContent }}>
      {children}
    </FileContext.Provider>
  );
};
