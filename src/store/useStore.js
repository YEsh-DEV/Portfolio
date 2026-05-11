import { create } from 'zustand';

/**
 * Global application state store.
 * Sections: 'home' | 'about' | 'projects' | 'contact'
 */
const useStore = create((set) => ({
  // ---- Loading ----
  isLoading: true,
  loadProgress: 0,
  showContent: false,
  setLoading: (val) => set({ isLoading: val }),
  setLoadProgress: (val) => set({ loadProgress: val }),
  setShowContent: (val) => set({ showContent: val }),

  // ---- Active Section (scroll-driven) ----
  activeSection: 'home',
  setActiveSection: (section) => set({ activeSection: section }),

  // ---- Scroll progress (0 to 1 across entire page) ----
  scrollProgress: 0,
  setScrollProgress: (val) => set({ scrollProgress: val }),

  // ---- Audio ----
  isMuted: true,
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  // ---- Cursor ----
  cursorVariant: 'default',
  setCursorVariant: (variant) => set({ cursorVariant: variant }),
}));

export default useStore;
