import React from "react";
import "./App.css";
import dedent from "dedent";
import Editor from "react-simple-code-editor";
import { languages, highlight } from "prismjs";
import "prismjs/components/prism-markdown";
import "prismjs/themes/prism.css";
import Markdown from "./Markdown";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Frame from "./Frame";
import { UserProvider } from "./user";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1976d2",
    },
  },
});

function App() {
  const [code, setCode] = React.useState(dedent`
  # Hello world

  This is some sample text

  ## Subtitle

  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla felis
  felis, pretium eget porttitor et, eleifend molestie leo. Sed efficitur
  iaculis justo. Cras tempus magna vel velit rutrum egestas. Nam ut est
  augue. Fusce felis velit, convallis at dictum sed, maximus a purus.
  Etiam quis commodo velit. Nam dictum, lectus nec sollicitudin elementum,
  eros enim porta orci, sit amet sodales urna nunc sed nisl. Vivamus nec
  pellentesque diam. 

  1. item a
  2. item b

  \`\`\`mermaid
  mindmap
    root((mindmap))
      Origins
        Long history
        ::icon(fa fa-book)
        Popularisation
          British popular psychology author Tony Buzan
      Research
        On effectiveness<br/>and features
        On Automatic creation
          Uses
              Creative techniques
              Strategic planning
              Argument mapping
      Tools
        Pen and paper
        Mermaid
  \`\`\`
  `);
  return (
    <UserProvider>
      <ThemeProvider theme={darkTheme}>
        <Frame />
        <div id="app">
          <Editor
            value={code}
            onValueChange={(code) => setCode(code)}
            highlight={(code) => highlight(code, languages.markdown, "md")}
            padding={10}
            id="editor"
          />
          <div id="preview">
            <Markdown code={code} />
          </div>
        </div>
      </ThemeProvider>
    </UserProvider>
  );
}

export default App;
