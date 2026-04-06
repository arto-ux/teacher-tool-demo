import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "../koreez-teacher-app.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
