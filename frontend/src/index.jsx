import React from "react";
import ReactDOM from "react-dom/client";
import { HomePage } from "./HomePage.js";
import { EventMap } from "./EventMap.jsx";

import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("No root element found");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <EventMap />
  </React.StrictMode>,
);
