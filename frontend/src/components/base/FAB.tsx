import { FiEdit2, FiFileText, FiMusic, FiPlus, FiBook } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function FABCreate() {
  const navigate = useNavigate();

  return (
    <div className="fab fab-flower">
      {/* a focusable div with tabIndex is necessary to work on all browsers. role="button" is necessary for accessibility */}
      <div tabIndex={0} role="button" className="btn btn-circle btn-lg">
        <FiPlus />
      </div>

      {/* Main Action button replaces the original button when FAB is open */}
      <button className="fab-main-action btn btn-circle btn-lg btn-primary">
        <FiEdit2 />
      </button>

      {/* buttons that show up when FAB is open */}
      <button className="btn btn-circle btn-lg" onClick={() => navigate("/hymn/create")} title="إنشاء ترنيمة">
        <FiMusic />
      </button>
      <button className="btn btn-circle btn-lg" onClick={() => navigate("/liturgy/create")} title="إنشاء كتاب ليتورجي">
        <FiBook />
      </button>
      {/* <button
        className="btn btn-circle btn-lg"
        onClick={() => navigate('/pack/create')}
        title="إنشاء مجموعة"
      >
        <FiFileText />
      </button> */}
    </div>
  );
}
