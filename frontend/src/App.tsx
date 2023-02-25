import React, { useEffect } from "react";
import "prismjs";
import "./App.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Frame from "./Frame";
import { UserProvider } from "./user";
import { FileProvider } from "./file";
import TwoPanels from "./TwoPanels";
import { ActionProvider } from "./Action";
import { SearchProvider } from "./SearchProvider";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1976d2",
    },
  },
});

function App() {
  useEffect(() => {
    const beforeUnloadListener = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      return (event.returnValue = "Are you sure you want to exit?");
    };

    window.addEventListener("beforeunload", beforeUnloadListener, {
      capture: true,
    });
    return () =>
      window.removeEventListener("beforeunload", beforeUnloadListener, {
        capture: true,
      });
  }, []);

  return (
    <SearchProvider>
      <UserProvider>
        <FileProvider>
          <ActionProvider>
            <ThemeProvider theme={darkTheme}>
              <Frame />
              <TwoPanels />
            </ThemeProvider>
          </ActionProvider>
        </FileProvider>
      </UserProvider>
    </SearchProvider>
  );
}

export default App;
