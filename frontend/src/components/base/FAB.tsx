import { FiEdit2, FiMusic, FiPlus, FiBook } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function FABCreate() {
  const navigate = useNavigate();

  return (
    <div className="fab fab-flower">
      {/* a focusable div with tabIndex is necessary to work on all browsers. role="button" is necessary for accessibility */}
      <div tabIndex={0} role="button" aria-label="إنشاء محتوى جديد" className="btn btn-circle btn-lg">
        <FiPlus aria-hidden />
      </div>

      {/* Main Action button replaces the original button when FAB is open */}
      <button type="button" aria-label="إنشاء" className="fab-main-action btn btn-circle btn-lg btn-primary">
        <FiEdit2 aria-hidden />
      </button>

      {/* buttons that show up when FAB is open */}
      <button type="button" className="btn btn-circle btn-lg" onClick={() => navigate("/hymn/create")} title="إنشاء ترنيمة" aria-label="إنشاء ترنيمة">
        <FiMusic aria-hidden />
      </button>
      <button
        type="button"
        className="btn btn-circle btn-lg"
        onClick={() => navigate("/liturgy/create")}
        title="إنشاء كتاب ليتورجي"
        aria-label="إنشاء كتاب ليتورجي"
      >
        <FiBook aria-hidden />
      </button>
    </div>
  );
}
