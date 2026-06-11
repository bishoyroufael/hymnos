import { FiSave, FiX } from "react-icons/fi";

interface SaveCancelProps {
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

/** Save/cancel button pair used by the inline edit forms on the book/hymn pages. */
export default function SaveCancel({ onSave, onCancel, saving }: SaveCancelProps) {
  return (
    <div className="flex gap-2 mt-2">
      <button type="button" className="btn btn-primary btn-sm gap-1" onClick={onSave} disabled={saving}>
        {saving ? <span className="loading loading-spinner loading-xs" /> : <FiSave className="w-3 h-3" />}
        حفظ
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={saving}>
        <FiX className="w-3 h-3" />
        إلغاء
      </button>
    </div>
  );
}
