import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import PanelErrorBoundary from "./components/ui/PanelErrorBoundary";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PanelErrorBoundary area="Avespet"><App /></PanelErrorBoundary>
  </React.StrictMode>
);
