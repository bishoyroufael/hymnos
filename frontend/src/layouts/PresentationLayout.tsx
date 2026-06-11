import { Outlet } from 'react-router-dom';

export default function PresentationLayout() {
  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <Outlet />
    </div>
  );
}
