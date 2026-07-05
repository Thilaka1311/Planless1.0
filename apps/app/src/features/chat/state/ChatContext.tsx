import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from "react";
import { ChatMessage } from "../../../core/types";
import { DbCircleMessage } from "../../../lib/db";
import { supabase } from "../../../lib/supabaseClient";


interface ChatState {
  activeCircleId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  connectionStatus: "Connected" | "Reconnecting" | "Offline";
  setActiveRoom: (circleId: string | null) => void;
  sendMessage: (content: string) => Promise<void>;
  loadMessages: () => Promise<void>;
}

const ChatContext = createContext<ChatState | undefined>(undefined);

export const ChatProvider = ({
  children,
  userId = ""
}: {
  children: ReactNode;
  userId?: string;
}) => {
  const [activeCircleId, setActiveCircleId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"Connected" | "Reconnecting" | "Offline">("Offline");

  const activeCircleIdRef = useRef<string | null>(null);

  // Sync ref to avoid stale closures in callbacks
  useEffect(() => {
    activeCircleIdRef.current = activeCircleId;
  }, [activeCircleId]);

  // Load the last 50 messages for the active circle
  const loadMessages = useCallback(async (silent = false) => {
    const circleId = activeCircleIdRef.current;
    if (!circleId) {
      setMessages([]);
      return;
    }

    if (!silent) {
      setIsLoading(true);
    }
    try {
      const res = await fetch(`/api/db/chat/messages?user_id=${userId}&circle_id=${circleId}`);
      if (!res.ok) {
        console.warn("[ChatContext] Failed to load messages. Server returned status:", res.status);
        return;
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("[ChatContext] Received non-JSON response from server:", contentType);
        return;
      }

      const json = await res.json();
      const raw = json.data || [];

      // Map raw DB rows to ChatMessage — API returns DESC limit 50, reverse to render ASC
      const mapped: ChatMessage[] = raw.map((msg: any) => ({
        id: msg.id,
        circleId: msg.circle_id,
        sender: msg.sender
          ? {
              id: msg.sender.id,
              name: msg.sender.full_name || msg.sender.public_id || "User",
              avatar: msg.sender.profile_url || ""
            }
          : null,
        content: msg.message,
        createdAt: msg.created_at,
        isOwn: msg.sender_id === userId
      }));

      setMessages(mapped.reverse());
    } catch (err) {
      console.error("[ChatContext] Failed to load messages:", err);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  // Background recovery — refetch on tab focus, visibility change, or coming online
  const lastRecoveryRef = useRef<number>(0);
  useEffect(() => {
    const triggerRecovery = () => {
      const now = Date.now();
      if (now - lastRecoveryRef.current < 10000) return;
      lastRecoveryRef.current = now;
      loadMessages(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") triggerRecovery();
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", triggerRecovery);
    window.addEventListener("online", triggerRecovery);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", triggerRecovery);
      window.removeEventListener("online", triggerRecovery);
    };
  }, [loadMessages]);

  // Real-time subscription scoped to the active Circle
  useEffect(() => {
    if (!activeCircleId) {
      setMessages([]);
      return;
    }

    console.log(`[ChatContext Realtime] Subscribing to: circle-realtime-${activeCircleId}`);
    const lastStatusRef = { current: "" };

    const channel = supabase
      .channel(`circle-realtime-${activeCircleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "circle_messages",
          filter: `circle_id=eq.${activeCircleId}`
        },
        async (payload) => {
          const raw = payload.new as DbCircleMessage;
          // Skip if already present (e.g. optimistic insert from this user)
          setMessages(prev => {
            if (prev.some(m => m.id === raw.id)) return prev;
            // Reload to get fully-joined sender data from the server
            // (async reload — messages will update momentarily)
            loadMessages(true);
            return prev;
          });
        }
      )
      .subscribe((status) => {
        const prevStatus = lastStatusRef.current;
        lastStatusRef.current = status;
        if (status === "SUBSCRIBED") {
          setConnectionStatus("Connected");
          // Catch up on any messages missed while reconnecting
          if (prevStatus && prevStatus !== "SUBSCRIBED") {
            loadMessages(true);
          }
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setConnectionStatus("Reconnecting");
        } else {
          setConnectionStatus("Offline");
        }
      });

    return () => {
      console.log(`[ChatContext Realtime] Unsubscribing from: circle-realtime-${activeCircleId}`);
      channel.unsubscribe();
    };
  }, [activeCircleId, loadMessages, userId]);

  // Set active room — triggers message load and real-time subscription
  const setActiveRoom = useCallback((circleId: string | null) => {
    setActiveCircleId(circleId);
  }, []);

  // Load messages whenever the active circle changes
  useEffect(() => {
    if (activeCircleId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [activeCircleId, loadMessages]);

  // Send a plain text message to the active Circle Chat
  const sendMessage = useCallback(async (content: string) => {
    const circleId = activeCircleIdRef.current;
    if (!circleId) {
      console.warn("[ChatContext] Cannot send message: no active circle.");
      return;
    }

    const payload: Partial<DbCircleMessage> = {
      circle_id: circleId,
      sender_id: userId,
      message: content
    };

    // Optimistic insert for immediate feedback
    const tempId = `optimistic-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      circleId,
      sender: userId ? { id: userId, name: "You", avatar: "" } : null,
      content,
      createdAt: new Date().toISOString(),
      isOwn: true
    };

    setMessages(prev => [...prev, optimistic]);

    try {
      const res = await fetch("/api/db/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "circle_messages", records: [payload] })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Upsert failed");
      }

      const json = await res.json();
      const savedRow = json.data?.[0];

      if (savedRow) {
        setMessages(prev =>
          prev.map(m =>
            m.id === tempId
              ? { ...m, id: savedRow.id, createdAt: savedRow.created_at }
              : m
          )
        );
      }
    } catch (err: any) {
      console.error("[ChatContext] Send message failed:", err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert(`Failed to send: ${err.message}`);
    }
  }, [userId]);

  return (
    <ChatContext.Provider
      value={{
        activeCircleId,
        messages,
        isLoading,
        connectionStatus,
        setActiveRoom,
        sendMessage,
        loadMessages
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatStore = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatStore must be used within a ChatProvider");
  }
  return context;
};
