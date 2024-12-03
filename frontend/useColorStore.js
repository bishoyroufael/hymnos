import {create} from 'zustand';

const useColorStore = create((set) => ({
  backgroundColor: '#ffffff', // default color
  fontColor: '#000000',
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  setFontColor :(color)=>set({fontColor:color})
}));

export default useColorStore;
