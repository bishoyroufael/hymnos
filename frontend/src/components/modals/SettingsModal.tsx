import { toast } from "react-toastify";
import ResetDatabaseButton from "@/components/base/ResetDatabaseButton";

export default function SettingsModal() {
  const version = import.meta.env.VITE_GIT_HASH || "dev";
  const commitDate = import.meta.env.VITE_GIT_HASH_DATE;
  const dateLabel = commitDate ? new Date(commitDate).toLocaleString() : "dev-date";

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(version);
      toast.success("تم نسخ رقم الإصدار");
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  return (
    <dialog id="settings_modal" className="modal">
      <div className="modal-box" dir="rtl">
        {/* Header */}
        <h3 className="font-bold text-lg mb-4">إعدادات</h3>

        {/* Version — click the badge to copy the hash; commit date shown underneath */}
        <button type="button" onClick={copyHash} title="انقر لنسخ رقم الإصدار" className="flex flex-col items-start gap-1 mb-2 cursor-pointer">
          <span className="badge badge-info badge-md">الإصدار: {version}</span>
          <span className="text-xs opacity-60">{dateLabel}</span>
        </button>

        {/* Danger zone — reset the local database */}
        <div className="divider text-xs opacity-60">إعدادات متقدمة</div>
        <ResetDatabaseButton />

        {/* Close Button */}
        <div className="modal-action">
          <form method="dialog">
            {/* This button will close the modal */}
            <button className="btn btn-primary">إغلاق</button>
          </form>
        </div>
      </div>

      {/* Backdrop - clicking outside closes the modal */}
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
