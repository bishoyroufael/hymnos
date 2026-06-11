import { useRef, type ChangeEvent } from "react";
import { FiUpload, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import useHymnosStore from "../../store";
import { BUNDLED_BACKGROUNDS } from "./backgrounds";

export const BACKGROUND_MODAL_ID = "background_modal";

// Cap the source image so the base64 string fits comfortably in localStorage
// (data URLs are ~33% larger than the file, and the origin quota is ~5MB total).
const MAX_BACKGROUND_BYTES = 2.5 * 1024 * 1024;

/**
 * Background picker for presentation slides. Lets the user either upload an
 * image (stored as a base64 data URL) or pick one of the bundled images
 * (stored as its stable public path). Rendered once on the presentation page
 * and opened by id, independently of the auto-hiding toolbar.
 */
export default function BackgroundModal() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundImage = useHymnosStore((s) => s.presentationSettings.backgroundImage);
  const setPresentationSettings = useHymnosStore((s) => s.setPresentationSettings);

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("الرجاء اختيار ملف صورة");
      return;
    }
    if (file.size > MAX_BACKGROUND_BYTES) {
      toast.error("حجم الصورة كبير جدًا (الحد الأقصى 2.5 ميجابايت)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPresentationSettings({ backgroundImage: reader.result as string });
      toast.success("تم تعيين خلفية الشرائح");
    };
    reader.onerror = () => toast.error("تعذّر قراءة الصورة");
    reader.readAsDataURL(file);
  };

  const pickBundled = (src: string) => {
    setPresentationSettings({ backgroundImage: src });
    toast.success("تم تعيين خلفية الشرائح");
  };

  const removeBackground = () => {
    setPresentationSettings({ backgroundImage: undefined });
    toast.success("تمت إزالة الخلفية");
  };

  return (
    <dialog id={BACKGROUND_MODAL_ID} className="modal">
      <div className="modal-box" dir="rtl">
        <h3 className="font-bold text-lg mb-4">خلفية الشرائح</h3>

        {/* Upload from device */}
        <button type="button" className="btn btn-primary w-full gap-2" onClick={() => fileInputRef.current?.click()}>
          <FiUpload className="w-4 h-4" />
          رفع صورة من جهازك
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

        {/* Pick from the bundled library */}
        <div className="divider text-sm opacity-70">أو اختر من المكتبة</div>

        {BUNDLED_BACKGROUNDS.length === 0 ? (
          <p className="text-sm opacity-60 text-center py-4">لا توجد صور متاحة</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {BUNDLED_BACKGROUNDS.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => pickBundled(src)}
                className={`relative aspect-video overflow-hidden rounded-lg border-2 transition hover:opacity-90 ${
                  backgroundImage === src ? "border-primary" : "border-base-300"
                }`}
                title="اختيار هذه الصورة"
              >
                <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {backgroundImage && (
          <button type="button" className="btn btn-ghost btn-sm text-error w-full gap-2 mt-4" onClick={removeBackground}>
            <FiTrash2 className="w-4 h-4" />
            إزالة الخلفية
          </button>
        )}

        <div className="modal-action">
          <form method="dialog">
            <button className="btn">إغلاق</button>
          </form>
        </div>
      </div>

      {/* Backdrop closes the modal */}
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
