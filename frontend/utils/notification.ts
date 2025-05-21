import { Slide, toast } from "react-toastify";

export const emitError = (msg: string) => {
  toast.error(msg, {
    position: "bottom-center",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "light",
    transition: Slide,
  });
};

export const emitInfo = (msg: string, onCloseCallback?: () => void) => {
  toast.success(msg, {
    position: "bottom-center",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "light",
    transition: Slide,
    onClose(reason) {
      onCloseCallback?.();
    },
  });
};

export const emitWarning = (msg: string) => {
  toast.warning(msg, {
    position: "bottom-center",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "light",
    transition: Slide,
  });
};
