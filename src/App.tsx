import React from "react";
import "prismjs";
import "./App.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Frame from "./Frame";
import { UserProvider } from "./user";
import { FileProvider } from "./file";
import TwoPanels from "./TwoPanels";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1976d2",
    },
  },
});

function App() {
  return (
    <UserProvider>
      <FileProvider>
        <ThemeProvider theme={darkTheme}>
          <Frame />
          <TwoPanels />
        </ThemeProvider>
      </FileProvider>
    </UserProvider>
  );
}

export default App;
