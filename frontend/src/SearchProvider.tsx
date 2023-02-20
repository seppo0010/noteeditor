import { ReactNode, createContext } from "react";
// eslint-disable-next-line import/no-webpack-loader-syntax
const Worker = require("workerize-loader!./search.worker");

export interface SearchProviderInterface {
  children: ReactNode[] | ReactNode;
}

export interface SearchOpt {
  searchWorker: typeof Worker;
}

export interface SearchContextInterface {
  search: SearchOpt;
}

export const SearchContext = createContext<SearchContextInterface | null>(null);

const search = { searchWorker: new Worker() };

export const SearchProvider = ({ children }: SearchProviderInterface) => {
  return (
    <SearchContext.Provider value={{ search }}>
      {children}
    </SearchContext.Provider>
  );
};
