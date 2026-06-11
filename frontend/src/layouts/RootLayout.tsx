import { Outlet } from "react-router-dom";
import Header from "@components/base/Header";
import Footer from "@components/base/Footer";
import SettingsModal from "@components/modals/SettingsModal";

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col w-full overflow-x-clip" dir="rtl">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 w-11/12 md:w-10/12 lg:w-9/12 xl:w-6/12 mx-auto">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
}
