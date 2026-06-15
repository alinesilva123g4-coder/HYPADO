"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ChatContextValue = {
  open: boolean;
  unread: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  setUnread: (v: boolean) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);

  const toggle = useCallback(() => setOpen((o) => !o), []);

  const value = useMemo(
    () => ({ open, unread, setOpen, toggle, setUnread }),
    [open, unread, toggle],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat precisa estar dentro de <ChatProvider>");
  }
  return ctx;
}
