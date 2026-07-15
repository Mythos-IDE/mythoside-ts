import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "./global.css";
import { Theme } from "@astryxdesign/core";
import { warmNordicTheme } from "./lib/theme";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Theme theme={warmNordicTheme} mode="light">
      <App />
    </Theme>
  </React.StrictMode>,
);
