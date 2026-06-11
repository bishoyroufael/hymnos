export default function SettingsModal() {
  const version = import.meta.env.VITE_GIT_HASH || "dev";

  return (
    <dialog id="settings_modal" className="modal">
      <div className="modal-box" dir="rtl">
        {/* Header */}
        <h3 className="font-bold text-lg mb-4">إعدادات</h3>

        {/* Settings Menu */}
        <ul className="menu rounded-box w-full space-y-4">
          <li className="disabled">
            <div className="badge badge-info badge-md">الإصدار: {version}</div>
          </li>
        </ul>

        {/* Close Button */}
        <div className="modal-action">
          <form method="dialog">
            {/* This button will close the modal */}
            <button className="btn btn-primary">إغلاق</button>
          </form>
        </div>
      </div>

      {/* Backdrop - clicking outside closes the modal */}
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
