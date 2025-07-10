import { useCallback } from "react";

// deprecated
const useAutoSizeTextArea = (deps: any[]) => {
  return useCallback((node: any) => {
    if (node) {
      node.style.height = "0px";
      const scrollHeight = node.scrollHeight;
      node.style.height = scrollHeight + "px";
    }
  }, deps);
};

export default useAutoSizeTextArea;
