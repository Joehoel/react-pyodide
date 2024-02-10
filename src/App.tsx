import { useCallback, useEffect, useState } from "react";
import { PythonProvider, usePython } from "react-py";

function Codeblock() {
  const {
    runPython,
    stdout,
    stderr,
    isLoading,
    isRunning,
    writeFile,
    watchModules,
    readFile,
  } = usePython({
    packages: {
      micropip: ["python-pptx"],
    },
  });

  const [input, setInput] = useState(`
from pptx import Presentation
import os

print(os.getcwd())
print(os.listdir())


# Load the presentation
prs = Presentation("input.pptx")

# Example modification: Add a slide
slide_layout = prs.slide_layouts[0]  # Choosing a slide layout
slide = prs.slides.add_slide(slide_layout)
title = slide.shapes.title
title.text = "Added by Pyodide"

# Save the modified presentation
prs.save("output.pptx")
print(os.listdir())
      `);

  const write = useCallback(async () => {
    console.log(import.meta.env.BASE_URL);

    const res = await fetch("/ppt.pptx");
    const buffer = await res.arrayBuffer();

    const content = new Uint8Array(buffer);
    console.log({ content });

    await writeFile("input.pptx", content);
  }, [writeFile]);

  useEffect(() => {
    watchModules(["input", "output"]);
  }, []);

  const read = useCallback(async () => {
    const file = await readFile("output.pptx");

    const content = new Uint8Array(file);
    console.log({ file, content });

    // Creating a temporary link to download the modified PowerPoint
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([content], {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      })
    );
    link.download = "output.pptx";
    console.log(link.href);
    // link.click();
  }, [readFile]);

  return (
    <>
      {isLoading ? <p>Loading...</p> : <p>Ready!</p>}

      {/* Button to write */}
      <button
        onClick={() => {
          write();
        }}
      >
        Write
      </button>
      {/* Button to read */}
      <button
        onClick={() => {
          read();
        }}
      >
        Read
      </button>

      <form>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} />
        <input
          type="submit"
          value={!isRunning ? "Run" : "Running..."}
          disabled={isLoading || isRunning}
          onClick={(e) => {
            e.preventDefault();
            write();
            runPython(input);
          }}
        />
      </form>
      <p>Output</p>
      <pre>{stdout}</pre>
      <p>Error</p>
      <pre>{stderr}</pre>
    </>
  );
}

export default function App() {
  useEffect(() => {
    navigator.serviceWorker
      .register("/react-py-sw.js")
      .then((registration) =>
        console.log(
          "Service Worker registration successful with scope: ",
          registration.scope
        )
      )
      .catch((err) => console.log("Service Worker registration failed: ", err));
  }, []);

  return (
    <PythonProvider>
      <Codeblock />
    </PythonProvider>
  );
}
