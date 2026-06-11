import { useParams } from "react-router-dom";
import { usePGlite } from "@electric-sql/pglite-react";

export default function BiblePage() {
  const { uuid } = useParams<{ uuid: string }>();
  const db = usePGlite();

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">الكتاب المقدس</h1>
      <p className="text-lg">Bible Page</p>
      <p className="text-sm opacity-70 mt-2">Translation UUID: {uuid}</p>
      <p className="text-sm opacity-70">Database: {db ? "✅ Connected" : "❌ Not Connected"}</p>
    </div>
  );
}
