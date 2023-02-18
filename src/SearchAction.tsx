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
export type SearchAction = SearchActionAddCode;
export interface SearchActionOpt {
  actions: SearchAction[];
}

export interface SearchActionContextInterface {
  pending: SearchActionOpt;
  setPending: Dispatch<SetStateAction<SearchActionOpt>>;
}

export const SearchActionContext = createContext<SearchActionContextInterface>({
  pending: { actions: [] },
  setPending: () => {},
});

export const SearchActionProvider = ({
  children,
}: SearchActionProviderInterface) => {
  const [pending, setPending] = useState<SearchActionOpt>({ actions: [] });

  return (
    <SearchActionContext.Provider value={{ pending, setPending }}>
      {children}
    </SearchActionContext.Provider>
  );
};
