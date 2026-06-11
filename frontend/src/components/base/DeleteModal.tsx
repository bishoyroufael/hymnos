import { useEffect, useRef } from "react";

interface DeleteModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation dialog for destructive actions. Opens itself on mount via
 * showModal() so the browser handles focus trapping and Escape-to-close
 * (which fires onClose → onCancel).
 */
export default function DeleteModal({ title, message, onConfirm, onCancel }: DeleteModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} className="modal" onClose={onCancel}>
      <div className="modal-box" dir="rtl">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="py-4 text-base-content/70">{message}</p>
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            إلغاء
          </button>
          <button type="button" className="btn btn-error" onClick={onConfirm}>
            حذف
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
