import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  document.getElementById("root")!.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0a0a0a;color:#00ff41;font-family:monospace;text-align:center;padding:2rem">
      <h1 style="font-size:1.5rem;margin-bottom:1rem">⚠️ MeetFix – Konfiguráció hiányzik</h1>
      <p style="color:#aaa;max-width:480px">A GitHub repository secrets nem lettek beállítva.<br/>Menj a <strong style="color:#00ff41">Settings → Secrets and variables → Actions</strong> menübe és add hozzá:<br/><br/>
      <code style="background:#111;padding:4px 8px;border-radius:4px">VITE_SUPABASE_URL</code><br/>
      <code style="background:#111;padding:4px 8px;border-radius:4px">VITE_SUPABASE_PUBLISHABLE_KEY</code><br/><br/>
      Majd futtasd újra a GitHub Actions workflow-t.</p>
    </div>
  `;
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
