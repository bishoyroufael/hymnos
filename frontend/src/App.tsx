import { PGliteProvider } from "@electric-sql/pglite-react";
import { RouterProvider } from "react-router-dom";
import { cssTransition, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { router } from "./router";

interface AppProps {
  db: any; // PGlite instance with live extension from createPGliteInstance()
}

const SmoothTransition = cssTransition({
  enter: "fade-in-bottom",
  exit: "fade-out-bottom",
  collapse: true,
  collapseDuration: 300,
});

function App({ db }: AppProps) {
  return (
    <PGliteProvider db={db}>
      <ToastContainer transition={SmoothTransition} pauseOnHover draggable position="bottom-center" rtl />
      <RouterProvider router={router} />
    </PGliteProvider>
  );
}

export default App;
