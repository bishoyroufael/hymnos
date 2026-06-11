import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import App from "./App.tsx";
import { createPGliteInstance } from "@db/init";
import Loader from "@components/base/Loader";

// Create root element
const root = createRoot(document.getElementById("root")!);

// Show initial loading state
root.render(
  <StrictMode>
    <Loader message="جاري إعداد قاعدة البيانات..." />
  </StrictMode>
);

// Initialize database then render app
createPGliteInstance()
  .then((db) => {
    console.log("✓ Database initialized, rendering app...");
    root.render(
      <StrictMode>
        <App db={db} />
      </StrictMode>
    );
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    root.render(
      <StrictMode>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-4xl font-bold mb-4 text-error">خطأ في قاعدة البيانات</h1>
            <p className="text-lg mb-2">Database Initialization Error</p>
            <p className="text-sm opacity-70 max-w-md">{error instanceof Error ? error.message : "Unknown error"}</p>
            <button className="btn btn-primary mt-8" onClick={() => window.location.reload()}>
              إعادة المحاولة (Retry)
            </button>
          </div>
        </div>
      </StrictMode>
    );
  });
