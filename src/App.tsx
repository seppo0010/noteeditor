import React from "react";
import "./App.css";
import dedent from "dedent";
import Editor from "react-simple-code-editor";
import { languages, highlight } from "prismjs";
import ReactMarkdown from "react-markdown";
import "prismjs/components/prism-markdown";
import "prismjs/themes/prism.css";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkMermaidPlugin from "./mermaid";

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
  ---
  title: Animal example
  ---
  classDiagram
      note "From Duck till Zebra"
      Animal <|-- Duck
      note for Duck "can fly\ncan swim\ncan dive\ncan help in debugging"
      Animal <|-- Fish
      Animal <|-- Zebra
      Animal : +int age
      Animal : +String gender
      Animal: +isMammal()
      Animal: +mate()
      class Duck{
          +String beakColor
          +swim()
          +quack()
      }
      class Fish{
          -int sizeInFeet
          -canEat()
      }
      class Zebra{
          +bool is_wild
          +run()
      }
  \`\`\`
  `);
  return (
    <div id="app">
      <Editor
        value={code}
        onValueChange={(code) => setCode(code)}
        highlight={(code) => highlight(code, languages.markdown, "md")}
        padding={10}
        id="editor"
      />
      <div id="preview">
        <ReactMarkdown
          children={code}
          remarkPlugins={[remarkMermaidPlugin]}
          rehypePlugins={[rehypeRaw, rehypeStringify]}
        />
      </div>
    </div>
  );
}

export default App;
