import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface Message {
  id: string;
  sender: string;
  text: string;
  created_at: string;
}

export interface Room {
  id: string;
  code: string;
  name: string;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

interface ChatContextType {
  username: string;
  setUsername: (name: string) => void;
  currentRoom: Room | null;
  messages: Message[];
  createRoom: (name: string) => Promise<Room>;
  joinRoom: (code: string) => Promise<Room | null>;
  leaveRoom: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChatContext = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState("");
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Subscribe to real-time messages when in a room
  useEffect(() => {
    if (!currentRoom) {
      setMessages([]);
      return;
    }

    // Fetch existing messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender, text, created_at")
        .eq("room_id", currentRoom.id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`room-${currentRoom.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${currentRoom.id}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [currentRoom?.id]);

  const createRoom = useCallback(async (name: string): Promise<Room> => {
    const code = generateCode();
    const { data, error } = await supabase
      .from("rooms")
      .insert({ code, name })
      .select("id, code, name")
      .single();
    if (error || !data) throw new Error("Failed to create room");
    const room: Room = data;
    setCurrentRoom(room);
    return room;
  }, []);

  const joinRoom = useCallback(async (code: string): Promise<Room | null> => {
    const { data } = await supabase
      .from("rooms")
      .select("id, code, name")
      .eq("code", code.toUpperCase())
      .single();
    if (!data) return null;
    const room: Room = data;
    setCurrentRoom(room);
    return room;
  }, []);

  const leaveRoom = useCallback(async () => {
    if (!currentRoom) return;
    // Delete all messages in the room (temporary chats)
    await supabase.from("messages").delete().eq("room_id", currentRoom.id);
    // Optionally delete the room itself
    await supabase.from("rooms").delete().eq("id", currentRoom.id);
    setCurrentRoom(null);
    setMessages([]);
  }, [currentRoom]);

  const sendMessage = useCallback(async (text: string) => {
    if (!currentRoom || !text.trim()) return;
    await supabase.from("messages").insert({
      room_id: currentRoom.id,
      sender: username,
      text: text.trim(),
    });
  }, [currentRoom, username]);

  return (
    <ChatContext.Provider value={{ username, setUsername, currentRoom, messages, createRoom, joinRoom, leaveRoom, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};
