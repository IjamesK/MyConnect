import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { ErrorBoundary } from "./app/components/system/ErrorBoundary";
import "./styles/index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found");
}

createRoot(rootElement).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
