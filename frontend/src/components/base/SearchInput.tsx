import { useState, useEffect, useRef } from "react";
import { FiSearch } from "react-icons/fi";

interface SearchInputProps {
  onSearch: (query: string) => void;
  /** Called immediately on every keystroke, before the debounce fires. */
  onInputChange?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

/**
 * Simple debounced search input with a clear button.
 * Calls onSearch with the trimmed query after debounceMs of inactivity.
 * Calls onInputChange immediately on every keystroke.
 * Does not show a results dropdown — the caller handles rendering.
 *
 * To reset this component externally, change its `key` prop.
 */
export default function SearchInput({ onSearch, onInputChange, placeholder = "بحث...", debounceMs = 300, className = "" }: SearchInputProps) {
  const [value, setValue] = useState("");
  const onSearchRef = useRef(onSearch);
  const onInputChangeRef = useRef(onInputChange);

  // Keep latest callbacks without re-arming the debounce timer (refs must not
  // be written during render).
  useEffect(() => {
    onSearchRef.current = onSearch;
    onInputChangeRef.current = onInputChange;
  });

  useEffect(() => {
    const id = setTimeout(() => onSearchRef.current(value.trim()), debounceMs);
    return () => clearTimeout(id);
  }, [value, debounceMs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onInputChangeRef.current?.(e.target.value);
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <label className="input input-bordered input-sm lg:input-lg w-full p-2 lg:p-3">
        <FiSearch aria-hidden className="text-base-content/40" />
        <input type="search" name="search" dir="rtl" aria-label={placeholder} placeholder={placeholder} value={value} onChange={handleChange} />
      </label>
    </div>
  );
}
