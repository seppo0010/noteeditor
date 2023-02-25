import {
  ReactNode,
  useState,
  SetStateAction,
  createContext,
  Dispatch,
} from "react";

export interface ActionProviderInterface {
  children: ReactNode[] | ReactNode;
}
export interface ActionAddCode {
  type: "addCode";
  code: string;
}
export interface ActionShowText {
  type: "showText";
  starts: number;
  ends: number;
  path: string;
  code: string;
}
export interface ActionSave {
  type: "save";
}
export type Action = ActionAddCode | ActionShowText | ActionSave;
export type ActionOpt = (action: Action) => void;

export interface ActionContextInterface {
  callback: ActionOpt | null;
  setCallback: Dispatch<SetStateAction<ActionOpt | null>>;
}

export const ActionContext = createContext<ActionContextInterface | null>(null);

export const ActionProvider = ({ children }: ActionProviderInterface) => {
  const [callback, setCallback] = useState<ActionOpt | null>(null);

  return (
    <ActionContext.Provider value={{ callback, setCallback }}>
      {children}
    </ActionContext.Provider>
  );
};
