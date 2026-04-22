import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import QuickInputApp from "./QuickInputApp";

const root = createRoot(document.getElementById("root"));
const isQuickInput = window.location.pathname === "/quick-input";

root.render(
  <React.StrictMode>
    {isQuickInput ? <QuickInputApp /> : <App />}
  </React.StrictMode>
);
