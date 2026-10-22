import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { applyTheme, getSavedTheme } from "./lib/theme";
import { ErrorBoundary } from "./app/components/system/ErrorBoundary";
import "./styles/index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found");
}

applyTheme(getSavedTheme());

createRoot(rootElement).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
