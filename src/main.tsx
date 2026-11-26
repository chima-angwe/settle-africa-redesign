import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app/styles/globals.css";
import { App } from "./app/App";
import { QueryProvider } from "./app/providers";
import { Toaster } from "./shared/ui";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <App />
      <Toaster />
    </QueryProvider>
  </StrictMode>,
);
