import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface DeleteModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation dialog for destructive actions. Opens itself on mount via
 * showModal() so the browser handles focus trapping and Escape-to-close
 * (which fires onClose → onCancel).
 */
export default function DeleteModal({ title, message, confirmLabel = "حذف", onConfirm, onCancel }: DeleteModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  // Portal to <body> so the dialog isn't a child of any daisyUI `menu` <li> (whose
  // `li > *` item styling would otherwise position the modal as a menu entry).
  return createPortal(
    <dialog ref={ref} className="modal" onClose={onCancel}>
      <div className="modal-box" dir="rtl">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="py-4 text-base-content/70">{message}</p>
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            إلغاء
          </button>
          <button type="button" className="btn btn-error" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>,
    document.body
  );
}
