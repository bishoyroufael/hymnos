import { useState, useEffect, useRef } from "react";
import { FiSearch, FiX } from "react-icons/fi";

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
  onSearchRef.current = onSearch;
  const onInputChangeRef = useRef(onInputChange);
  onInputChangeRef.current = onInputChange;

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
        <FiSearch className="text-base-content/40" />
        <input type="search" dir="rtl" placeholder={placeholder} value={value} onChange={handleChange} />
      </label>
    </div>
  );
}
