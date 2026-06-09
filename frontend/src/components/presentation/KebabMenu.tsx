import { HiDotsHorizontal } from "react-icons/hi";

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger" | "warning";
  disabled?: boolean;
}

interface KebabMenuProps {
  items: MenuItem[];
  size?: "xs" | "sm" | "md";
}

export default function KebabMenu({ items, size = "sm" }: KebabMenuProps) {
  const buttonSizeClass = size === "xs" ? "btn-xs" : size === "sm" ? "btn-sm" : "";
  const iconSizeClass = size === "xs" ? "h-3 w-3" : size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="dropdown dropdown-start">
      <div tabIndex={0} className={`btn btn-ghost btn-circle ${buttonSizeClass} opacity-60 hover:opacity-100`}>
        <HiDotsHorizontal className={iconSizeClass} />
      </div>
      <ul tabIndex={1} className="dropdown-content menu bg-base-100 rounded-box shadow-lg w-52 z-99 p-2">
        {items.map((item, index) => (
          <li key={index}>
            <button
              onClick={(e) => {
                // Close dropdown
                // @ts-ignore
                document.activeElement?.blur();

                e.stopPropagation();
                item.onClick();
              }}
              disabled={item.disabled}
              className={`
                ${item.variant === "danger" ? "text-error hover:bg-error hover:text-error-content" : ""}
                ${item.variant === "warning" ? "text-warning hover:bg-warning hover:text-warning-content" : ""}
                ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
