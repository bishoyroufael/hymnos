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

  const handleClear = () => {
    setValue("");
    onInputChangeRef.current?.("");
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <FiSearch className="absolute right-3 lg:right-4 w-4 h-4 lg:w-5 lg:h-5 text-base-content/40 pointer-events-none z-10" />
      <input
        type="text"
        dir="rtl"
        className="input input-bordered input-sm lg:input-lg w-full pr-9 lg:pr-12 pl-8 lg:pl-10"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
      />
      {value ? (
        <button className="absolute left-2 lg:left-3 btn btn-ghost btn-xs btn-circle" onClick={handleClear} aria-label="مسح البحث">
          <FiX className="w-3 h-3 lg:w-4 lg:h-4" />
        </button>
      ) : null}
    </div>
  );
}
