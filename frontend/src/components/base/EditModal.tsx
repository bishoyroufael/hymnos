import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import InlineField from "./InlineField";

export interface EditModalField {
  key: string;
  label: string;
  multiline?: boolean;
  placeholder?: string;
  required?: boolean;
}

interface EditModalProps {
  title: string;
  fields: EditModalField[];
  initial: Record<string, string>;
  saveLabel?: string;
  /** Persist the edited values. Throwing keeps the modal open. */
  onSave: (values: Record<string, string>) => Promise<void> | void;
  onClose: () => void;
}

/**
 * Generic field-editing dialog reused for every CRUD edit/create in the app (book,
 * book node, …). The caller supplies the field schema, initial values, and an onSave
 * handler — all the editing concern lives here instead of being inlined per-component.
 */
export default function EditModal({ title, fields, initial, saveLabel = "حفظ", onSave, onClose }: EditModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const handleSave = async () => {
    const missing = fields.find((f) => f.required && !values[f.key]?.trim());
    if (missing) {
      toast.warning(`الرجاء إدخال: ${missing.label}`);
      return;
    }
    setSaving(true);
    try {
      await onSave(values);
      onClose();
    } catch {
      // onSave reports its own error; keep the modal open so edits aren't lost.
    } finally {
      setSaving(false);
    }
  };

  // Portal to <body> so the dialog isn't a child of any daisyUI `menu` <li> (whose
  // `li > *` item styling would otherwise position the modal as a menu entry).
  return createPortal(
    <dialog ref={ref} className="modal" onClose={onClose}>
      <div className="modal-box flex flex-col gap-3" dir="rtl">
        <h3 className="font-bold text-lg">{title}</h3>
        {fields.map((f) => (
          <InlineField
            key={f.key}
            label={f.required ? `${f.label} *` : f.label}
            value={values[f.key] ?? ""}
            onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
            multiline={f.multiline}
            placeholder={f.placeholder}
          />
        ))}
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            إلغاء
          </button>
          <button type="button" className="btn btn-primary gap-1" onClick={handleSave} disabled={saving}>
            {saving && <span className="loading loading-spinner loading-xs" />}
            {saveLabel}
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
