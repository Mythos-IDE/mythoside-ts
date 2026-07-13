import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "./design-system/neutral.css";
import "./design-system/typography.css";
import "./design-system/native.css";
import "./global.css";
import { Theme } from "@astryxdesign/core";
import { neutralTheme } from "./design-system/neutral";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Theme theme={neutralTheme} mode="light">
      <App />
    </Theme>
  </React.StrictMode>,
);
