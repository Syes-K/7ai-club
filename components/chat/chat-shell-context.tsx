"use client";

import { createContext, useContext } from "react";

type ChatShellContextValue = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  openNewChatPicker: () => void;
  creating: boolean;
};

const ChatShellContext = createContext<ChatShellContextValue | null>(null);

export function ChatShellProvider({
  value,
  children,
}: {
  value: ChatShellContextValue;
  children: React.ReactNode;
}) {
  return (
    <ChatShellContext.Provider value={value}>{children}</ChatShellContext.Provider>
  );
}

export function useChatShell() {
  const ctx = useContext(ChatShellContext);
  if (!ctx) {
    throw new Error("useChatShell must be used within ChatAppShell");
  }
  return ctx;
}
