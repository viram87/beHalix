import { create } from 'zustand';

type LoginModalState = {
  open: boolean;
  returnTo: string | null;
  openLoginModal: (returnTo?: string) => void;
  closeLoginModal: () => void;
};

export const useLoginModalStore = create<LoginModalState>((set) => ({
  open: false,
  returnTo: null,
  openLoginModal: (returnTo) => set({ open: true, returnTo: returnTo ?? null }),
  closeLoginModal: () => set({ open: false, returnTo: null }),
}));
