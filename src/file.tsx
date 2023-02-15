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
import { UserContext } from "./user";

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
  Buffer.from(str, "base64").toString("binary");

export interface Content {
  path: string;
  innerContent:
    | { loading: true; text: undefined }
    | { loading: false; text: string };
}

export function contentsAreEqual(c1: Content, c2: Content): boolean {
  return (
    c1.path === c2.path &&
    c1.innerContent.loading === c2.innerContent.loading &&
    c1.innerContent?.text === c2.innerContent?.text
  );
}

export function cloneContent({
  path,
  innerContent: { loading, text },
}: Content): Content {
  return {
    path,
    innerContent: {
      loading,
      text,
    },
  } as Content;
}

export interface FileContextInterface {
  file: FileOpt;
  setFile: Dispatch<SetStateAction<FileOpt>>;
  content: Content | null;
}

export const FileContext = createContext<FileContextInterface | null>(null);

export const FileProvider = ({ children }: FileProviderInterface) => {
  const [file, setFile] = useState<FileOpt>(
    JSON.parse(localStorage.getItem("file") ?? "{}")
  );

  const { user } = useContext(UserContext)!;
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
          innerContent: { loading: true, text: undefined },
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
            innerContent: { loading: false, text },
          });
        })();
      } else {
        setContent(null);
      }
    }
  }, [content?.path, file, user]);

  useEffect(() => {
    if (file) {
      localStorage.setItem("file", JSON.stringify(file));
    }
  }, [file]);

  return (
    <FileContext.Provider value={{ file, setFile, content }}>
      {children}
    </FileContext.Provider>
  );
};
