import { useId } from "react";

interface InlineFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}

/** Small labelled input used by the inline edit forms on the book/hymn pages. */
export default function InlineField({ label, value, onChange, multiline = false, placeholder = "" }: InlineFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-base-content/50">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          className="textarea textarea-bordered textarea-sm h-16 w-full"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input id={id} className="input input-bordered input-sm w-full" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}
