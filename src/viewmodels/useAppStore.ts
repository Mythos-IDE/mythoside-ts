import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hashPassword } from "../services/cryptoService";

interface LocalUser {
  email: string;
  passwordHash: string;
}

interface AppState {
  isAuthenticated: boolean;
  localUser: LocalUser | null;

  // Actions
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasLocalAccount: () => boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      localUser: null,

      register: async (email: string, password: string) => {
        const passwordHash = await hashPassword(password);
        set({
          localUser: { email, passwordHash },
          isAuthenticated: true,
        });
      },

      login: async (email: string, password: string) => {
        const { localUser } = get();
        if (!localUser) return false;

        const passwordHash = await hashPassword(password);
        if (localUser.email === email && localUser.passwordHash === passwordHash) {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => set({ isAuthenticated: false }),

      hasLocalAccount: () => get().localUser !== null,
    }),
    {
      name: "mythoside-vault", // Unique name for local storage key
      // Only the durable account record belongs on disk. `isAuthenticated` is a
      // runtime session flag — persisting it would rehydrate an unlocked vault
      // on next launch without the master password ever being re-entered.
      partialize: (state) => ({ localUser: state.localUser }),
    },
  ),
);
