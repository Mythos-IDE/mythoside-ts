import { create } from "zustand";

interface WorkspaceState {
  activeDocumentId: string | null;
  activeCharacterId: string | null;
  sidebarExpanded: boolean;

  setActiveDocument: (id: string | null) => void;
  setActiveCharacter: (id: string | null) => void;
  toggleSidebar: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeDocumentId: null,
  activeCharacterId: null,
  sidebarExpanded: true,

  setActiveDocument: (id) => set({ activeDocumentId: id }),
  setActiveCharacter: (id) => set({ activeCharacterId: id }),
  toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
}));
