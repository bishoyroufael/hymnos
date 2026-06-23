import { useState } from "react";
import { usePGlite } from "@electric-sql/pglite-react";
import { FiRefreshCw } from "react-icons/fi";
import { toast } from "react-toastify";
import DeleteModal from "./DeleteModal";
import { resetLocalDatabase } from "@/db/reset";

interface ResetDatabaseButtonProps {
  /** Override the trigger button styling (defaults to a small outlined error button). */
  className?: string;
}

/**
 * Self-contained "reset the local database" action: a trigger button + a confirm dialog.
 * On confirm it wipes the PGlite IndexedDB store and reloads, so the schema and seed data
 * re-initialize from scratch (useful when the local schema drifts). Drop it anywhere —
 * it pulls the live PGlite instance from context to close it cleanly before deleting.
 */
export default function ResetDatabaseButton({ className }: ResetDatabaseButtonProps) {
  const db = usePGlite();
  const [confirm, setConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetLocalDatabase(db); // reloads the page on success
    } catch (e) {
      console.error("Failed to reset database:", e);
      toast.error("تعذّر إعادة تعيين قاعدة البيانات");
      setResetting(false);
      setConfirm(false);
    }
  };

  return (
    <>
      <button type="button" className={className ?? "btn btn-error btn-outline btn-sm gap-2"} onClick={() => setConfirm(true)} disabled={resetting}>
        {resetting ? <span className="loading loading-spinner loading-xs" /> : <FiRefreshCw className="w-4 h-4" />}
        إعادة ضبط قاعدة البيانات
      </button>
      {confirm && (
        <DeleteModal
          title="إعادة ضبط قاعدة البيانات"
          message="سيتم حذف قاعدة البيانات بالكامل وإعادة تحميل الصفحة لإعادة تهيئة كل شيء من جديد. لا يمكن التراجع عن هذا الإجراء. هل أنت متأكد؟"
          confirmLabel="إعادة ضبط"
          onConfirm={handleReset}
          onCancel={() => setConfirm(false)}
        />
      )}
    </>
  );
}
