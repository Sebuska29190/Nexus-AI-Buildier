import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";
import { I18nProvider } from "./lib/i18n";
import App from "./App";

try {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <I18nProvider>
        <App />
      </I18nProvider>
    </StrictMode>
  );
} catch (e) {
  const root = document.getElementById("root")!;
  root.textContent = "";
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:1rem;color:#ef4444;font-family:sans-serif;background:#020408";
  const h2 = document.createElement("h2");
  h2.style.color = "#00f2fe";
  h2.textContent = "Loading error";
  const pre = document.createElement("pre");
  pre.style.cssText = "font-size:0.8rem;max-width:80%;overflow:auto;color:#f0e6d2";
  pre.textContent = e instanceof Error ? e.message : String(e);
  const btn = document.createElement("button");
  btn.textContent = "Refresh";
  btn.style.cssText = "padding:0.5rem 1rem;border-radius:6px;border:1px solid #00f2fe;background:rgba(0,242,254,0.1);color:#f0e6d2;cursor:pointer";
  btn.onclick = () => location.reload();
  wrapper.append(h2, pre, btn);
  root.appendChild(wrapper);
}
