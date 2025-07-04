import { useCallback } from "react";

const useAutoSizeTextArea = (...deps: any[]) => {
  return useCallback((node: any) => {
    // console.log(deps);
    if (node) {
      node.style.height = "0px";
      // console.log("useLayoutEffect Rendered!", textArea?.scrollHeight);
      const scrollHeight = node.scrollHeight;
      node.style.height = scrollHeight + "px";
    }
  }, deps);
};

export default useAutoSizeTextArea;
