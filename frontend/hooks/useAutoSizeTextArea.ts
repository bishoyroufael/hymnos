import { useLayoutEffect } from "react";

// https://dev.to/sachinchaurasiya/how-to-dynamically-adjust-the-height-of-a-textarea-in-reactjs-3ckd
const useAutoSizeTextArea = (
  id: string,
  textAreaRef: HTMLTextAreaElement | null,
  ...deps: any[]
) => {
  // this will calculate the height of textArea before DOM paints
  useLayoutEffect(() => {
    const textArea = textAreaRef ?? document.getElementById(id);
    // console.log("useLayoutEffect Rendered!", textArea?.textContent);

    if (textArea && textArea.scrollHeight > 0) {
      // we shouldn't do anything in case scrollHeight is 0
      // We need to reset the height momentarily to get the correct scrollHeight for the textarea
      textArea.style.height = "0px";
      const scrollHeight = textArea.scrollHeight;
      textArea.style.height = scrollHeight + "px";
    }
  }, [textAreaRef, id, ...deps]);
};

export default useAutoSizeTextArea;
