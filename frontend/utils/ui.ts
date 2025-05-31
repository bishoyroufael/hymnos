// Function to get switch to fullscreen before
// going to presentation view
// Note: must be called from a user gesture i.e onClick, ...etc
// otherwise will cause error
export const toggleFullScreen = () => {
  const docElem = document.documentElement;
  if (docElem.requestFullscreen) {
    docElem.requestFullscreen();
  }
};
