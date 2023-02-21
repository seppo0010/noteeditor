import {
  ReactNode,
  useState,
  SetStateAction,
  createContext,
  Dispatch,
} from "react";

export interface SearchActionProviderInterface {
  children: ReactNode[] | ReactNode;
}
export interface SearchActionAddCode {
  type: "addCode";
  code: string;
}
export interface SearchActionShowText {
  type: "showText";
  starts: number;
  ends: number;
  path: string;
  code: string;
}
export type SearchAction = SearchActionAddCode | SearchActionShowText;
export type SearchActionOpt = (action: SearchAction) => void;

export interface SearchActionContextInterface {
  callback: SearchActionOpt | null;
  setCallback: Dispatch<SetStateAction<SearchActionOpt | null>>;
}

export const SearchActionContext = createContext<SearchActionContextInterface | null>(
  null
);

export const SearchActionProvider = ({
  children,
}: SearchActionProviderInterface) => {
  const [callback, setCallback] = useState<SearchActionOpt | null>(null);

  return (
    <SearchActionContext.Provider value={{ callback, setCallback }}>
      {children}
    </SearchActionContext.Provider>
  );
};
