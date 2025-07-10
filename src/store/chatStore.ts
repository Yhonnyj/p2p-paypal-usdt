// store/chatStore.ts
import { create } from 'zustand';

type ChatState = {
  isChatModalOpen: boolean;
  setIsChatModalOpen: (open: boolean) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  isChatModalOpen: false,
  setIsChatModalOpen: (open) => set({ isChatModalOpen: open }),
}));
