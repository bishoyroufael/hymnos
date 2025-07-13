import HymnosPageWrapper from "@components/base/HymnosPageWrapper";
import { PGliteProvider } from "context/PGliteContext";
import { TypographyProvider } from "context/TypographyContext";
import { Slot, usePathname } from "expo-router";
import { ToastContainer } from "react-toastify";

export default function Layout() {
  const path = usePathname();
  const isPresentationPage = path.startsWith("/presentation");

  return (
    <TypographyProvider>
      <ToastContainer />
      <PGliteProvider>
        <HymnosPageWrapper presentationMode={isPresentationPage}>
          <Slot />
        </HymnosPageWrapper>
      </PGliteProvider>
    </TypographyProvider>
  );
}
