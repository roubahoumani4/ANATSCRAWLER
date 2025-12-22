import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import axios configuration to ensure it's applied globally
import "./lib/axios";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(<App />);
