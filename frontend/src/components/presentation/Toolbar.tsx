import { FiInfo, FiShare2, FiEdit, FiTrash2, FiX, FiCheck, FiPlus, FiSettings, FiList, FiImage } from "react-icons/fi";
import { useState } from "react";
import { usePresentation } from "../../contexts/PresentationContext";
import { BACKGROUND_MODAL_ID } from "./BackgroundModal";
import { useAutoHide } from "@hooks/useAutoHide";
import useHymnosStore from "../../store";

const THEMES = ["light", "synthwave", "retro", "cyberpunk", "valentine", "halloween", "black", "luxury", "lemonade", "night", "coffee"];
const FONT_FAMILIES = ["font-rubik", "font-amiri", "font-cairo", "font-lalezar", "font-lateef", "font-rakkas"];

interface ToolbarProps {
  isBibleChapter: boolean;
  onInfo: () => void;
  onShare: () => void;
  tocDrawerId?: string;
}

export function Toolbar({ isBibleChapter, onInfo, onShare, tocDrawerId }: ToolbarProps) {
  const { state, dispatch, submitEdit } = usePresentation();
  const presentationSettings = useHymnosStore((s) => s.presentationSettings);
  const setPresentationSettings = useHymnosStore((s) => s.setPresentationSettings);

  const [isHoveringToolbar, setIsHoveringToolbar] = useState(false);
  const isVisible = useAutoHide(3000, isHoveringToolbar);

  if (!isVisible) return null;

  const increaseFontSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (presentationSettings.fontSizeScale < 1.5) {
      setPresentationSettings({ fontSizeScale: presentationSettings.fontSizeScale + 0.1 });
    }
  };

  const decreaseFontSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (presentationSettings.fontSizeScale > 0.5) {
      setPresentationSettings({ fontSizeScale: presentationSettings.fontSizeScale - 0.1 });
    }
  };

  const handleThemeChange = (theme: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setPresentationSettings({ theme });
  };

  const handleFontFamilyChange = (fontFamily: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setPresentationSettings({ fontFamily });
  };

  const handleButtonClick = (callback: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    callback();
  };

  const openBackgroundModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    (document.getElementById(BACKGROUND_MODAL_ID) as HTMLDialogElement | null)?.showModal();
  };

  // Action handlers using dispatch
  const handleEdit = () => dispatch({ type: "ENTER_EDIT_MODE" });
  const handleDelete = () => dispatch({ type: "DELETE_SLIDE" });
  const handleCancel = () => dispatch({ type: "CANCEL_EDIT" });
  const handleSubmit = async () => {
    try {
      await submitEdit();
    } catch (error) {
      // Error is surfaced to the user via toast in submitEdit().
      console.error("Failed to save changes:", error);
    }
  };

  return (
    <div
      dir="ltr"
      className="absolute top-0 left-0 right-0 z-20 bg-transparent"
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setIsHoveringToolbar(true)}
      onMouseLeave={() => setIsHoveringToolbar(false)}
    >
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left Side - Settings Icon with Dropdown */}
        <div className="dropdown">
          <button tabIndex={0} className="btn btn-ghost btn-circle" title="الإعدادات" aria-label="الإعدادات">
            <FiSettings className="w-4 h-4" />
          </button>
          <ul tabIndex={0} className="dropdown-content menu bg-base-200 rounded-box z-1 w-64 p-2 shadow-xl mt-2">
            {/* Theme Submenu */}
            <li>
              <details>
                <summary>الألوان</summary>
                <ul className="flex flex-col gap-1 p-2">
                  {THEMES.map((theme) => (
                    <li key={theme}>
                      <button
                        onClick={handleThemeChange(theme)}
                        data-theme={theme}
                        className={`btn btn-ghost w-full p-2 rounded bg-base-100 ${
                          presentationSettings.theme === theme ? "border-2 border-primary" : ""
                        }`}
                        title={theme}
                      >
                        <div className="text-base-content p-2 rounded text-sm w-full">تَوِّبْنِي فَأَتُوبَ</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            </li>

            {/* Font Family */}
            <li>
              <details>
                <summary>نوع الخط</summary>
                <ul className="flex flex-col gap-1 p-2">
                  {FONT_FAMILIES.map((fontFamily) => (
                    <li key={fontFamily}>
                      <button
                        onClick={handleFontFamilyChange(fontFamily)}
                        className={`btn btn-ghost w-full p-2 rounded bg-base-100 ${
                          presentationSettings.fontFamily === fontFamily ? "border-2 border-primary" : ""
                        }`}
                        title={fontFamily}
                      >
                        <div className={`text-base-content p-2 rounded text-sm w-full ${fontFamily}`}>تَوِّبْنِي فَأَتُوبَ</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            </li>

            {/* Font Size */}
            <li>
              <div className="flex items-center justify-between gap-2">
                <span>حجم الخط</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={decreaseFontSize}
                    className="btn btn-xs btn-circle"
                    disabled={Math.round(presentationSettings.fontSizeScale * 100) <= 50}
                  >
                    -
                  </button>
                  <span className="text-sm font-mono w-12 text-center">{Math.round(presentationSettings.fontSizeScale * 100)}%</span>
                  <button
                    onClick={increaseFontSize}
                    className="btn btn-xs btn-circle"
                    disabled={Math.round(presentationSettings.fontSizeScale * 100) >= 150}
                  >
                    +
                  </button>
                </div>
              </div>
            </li>

            {/* Background Image */}
            <li>
              <button onClick={openBackgroundModal} className="flex items-center gap-2" title="خلفية الشرائح">
                <FiImage className="w-4 h-4" />
                صورة الخلفية
              </button>
            </li>

            {/* Background filters — only shown when a background image is set */}
            {presentationSettings.backgroundImage && (
              <>
                <li>
                  <div className="flex items-center justify-between gap-2">
                    <span>Blur</span>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={1}
                      value={presentationSettings.backgroundBlur ?? 0}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setPresentationSettings({ backgroundBlur: Number(e.target.value) })}
                      className="w-32 accent-primary cursor-pointer"
                      title="Blur Image"
                    />
                  </div>
                </li>
                <li>
                  <div className="flex items-center justify-between gap-2">
                    <span>Opacity</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={presentationSettings.backgroundOpacity ?? 1}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setPresentationSettings({ backgroundOpacity: Number(e.target.value) })}
                      className="w-32 accent-primary cursor-pointer"
                      title="Image Opacity"
                    />
                  </div>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Center - Edit Mode Controls */}
        {state.isEditingMode && (
          <div className="flex gap-2">
            <button onClick={handleButtonClick(handleDelete)} className="btn btn-sm btn-error" title="حذف الشريحة" aria-label="حذف الشريحة">
              <FiTrash2 className="w-4 h-4" />
            </button>
            <button onClick={handleButtonClick(handleCancel)} className="btn btn-sm btn-warning" title="إلغاء" aria-label="إلغاء">
              <FiX className="w-4 h-4" />
            </button>
            <button onClick={handleButtonClick(handleSubmit)} className="btn btn-sm btn-success" title="حفظ" aria-label="حفظ">
              <FiCheck className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Right Side - View Mode Controls */}
        {!state.isEditingMode && !isBibleChapter && (
          <div className="flex gap-2">
            <button onClick={handleButtonClick(onInfo)} className="btn btn-sm btn-ghost" title="معلومات" aria-label="معلومات">
              <FiInfo className="w-4 h-4" />
            </button>
            <button onClick={handleButtonClick(onShare)} className="btn btn-sm btn-ghost" title="مشاركة" aria-label="مشاركة">
              <FiShare2 className="w-4 h-4" />
            </button>
            <button onClick={handleButtonClick(handleEdit)} className="btn btn-sm btn-ghost" title="تعديل" aria-label="تعديل">
              <FiEdit className="w-4 h-4" />
            </button>
            {tocDrawerId && (
              <label htmlFor={tocDrawerId} className="btn btn-sm btn-ghost" title="فهرس الكتاب" aria-label="فهرس الكتاب" onClick={(e) => e.stopPropagation()}>
                <FiList className="w-4 h-4" />
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface PlusButtonProps {
  position: "left" | "right";
  onClick: () => void;
}

export function PlusButton({ position, onClick }: PlusButtonProps) {
  const isVisible = useAutoHide(3000);

  if (!isVisible) return null;

  const positionClass = position === "left" ? "left-8" : "right-8";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      aria-label="إضافة شريحة"
      className={`
        absolute ${positionClass} top-1/2 -translate-y-1/2 z-10
        btn btn-circle btn-primary
        hover:scale-125 transition-transform
        animate-pulse
      `}
    >
      <FiPlus className="w-8 h-8" />
    </button>
  );
}
