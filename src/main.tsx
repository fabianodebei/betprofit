import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BetLegProvider } from "./contexts/BetLegContext";

createRoot(document.getElementById("root")!).render(
  <BetLegProvider>
    <App />
  </BetLegProvider>
);
