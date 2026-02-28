import { create } from 'zustand';

interface ScrollState {
    progress: number;
    setProgress: (val: number) => void;
}

export const useScrollStore = create<ScrollState>((set) => ({
    progress: 0,
    setProgress: (val) => set({ progress: val }),
}));
