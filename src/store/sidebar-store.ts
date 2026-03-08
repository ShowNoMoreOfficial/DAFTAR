import { create } from "zustand";

interface SidebarStore {
  isCollapsed: boolean;
  isRightPanelOpen: boolean;
  rightPanelContent: React.ReactNode | null;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openRightPanel: (content: React.ReactNode) => void;
  closeRightPanel: () => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isCollapsed: false,
  isRightPanelOpen: false,
  rightPanelContent: null,
  toggleSidebar: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
  openRightPanel: (content) =>
    set({ isRightPanelOpen: true, rightPanelContent: content }),
  closeRightPanel: () =>
    set({ isRightPanelOpen: false, rightPanelContent: null }),
}));
