import {
  ReactNode,
  useState,
  useEffect,
  SetStateAction,
  createContext,
  Dispatch,
} from "react";

export interface FileProviderInterface {
  children: ReactNode[] | ReactNode;
}

export interface FileOpt {
  repository?: {
    owner: string;
    name: string;
  };
}

export interface FileContextInterface {
  file: FileOpt;
  setFile: Dispatch<SetStateAction<FileOpt>>;
}

export const FileContext = createContext<FileContextInterface | null>(null);

export const FileProvider = ({ children }: FileProviderInterface) => {
  const [file, setFile] = useState<FileOpt>(
    JSON.parse(localStorage.getItem("file") ?? "{}")
  );

  useEffect(() => {
    if (file) {
      localStorage.setItem("file", JSON.stringify(file));
    }
  }, [file]);

  return (
    <FileContext.Provider value={{ file, setFile }}>
      {children}
    </FileContext.Provider>
  );
};
