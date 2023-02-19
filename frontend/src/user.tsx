import {
  ReactNode,
  useState,
  useEffect,
  SetStateAction,
  createContext,
  Dispatch,
} from "react";

export interface UserProviderInterface {
  children: ReactNode[] | ReactNode;
}

export interface UserOpt {
  loggedIn?: {
    avatar: string;
    auth: string;
  };
}

export interface UserContextInterface {
  user: UserOpt;
  setUser: Dispatch<SetStateAction<UserOpt>>;
}

export const UserContext = createContext<UserContextInterface | null>(null);

export const UserProvider = ({ children }: UserProviderInterface) => {
  const [user, setUser] = useState<UserOpt>(
    JSON.parse(localStorage.getItem("user") ?? "{}")
  );

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
