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
  memberCount: number;
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
  const [memberCount, setMemberCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchMemberCount = useCallback(async (roomId: string) => {
    const { count } = await supabase
      .from("room_members")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId);
    setMemberCount(count ?? 0);
  }, []);

  // Subscribe to real-time messages when in a room
  useEffect(() => {
    if (!currentRoom) {
      setMessages([]);
      setMemberCount(0);
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
    fetchMemberCount(currentRoom.id);

    // Subscribe to new messages and member changes
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${currentRoom.id}` },
        () => {
          fetchMemberCount(currentRoom.id);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [currentRoom?.id, fetchMemberCount]);

  const addMember = useCallback(async (roomId: string) => {
    await supabase.from("room_members").upsert(
      { room_id: roomId, username },
      { onConflict: "room_id,username" }
    );
  }, [username]);

  const createRoom = useCallback(async (name: string): Promise<Room> => {
    const code = generateCode();
    const { data, error } = await supabase
      .from("rooms")
      .insert({ code, name })
      .select("id, code, name")
      .single();
    if (error || !data) throw new Error("Failed to create room");
    const room: Room = data;
    await addMember(room.id);
    setCurrentRoom(room);
    return room;
  }, [addMember]);

  const joinRoom = useCallback(async (code: string): Promise<Room | null> => {
    const { data } = await supabase
      .from("rooms")
      .select("id, code, name")
      .eq("code", code.toUpperCase())
      .single();
    if (!data) return null;
    const room: Room = data;
    await addMember(room.id);
    setCurrentRoom(room);
    return room;
  }, [addMember]);

  const leaveRoom = useCallback(async () => {
    if (!currentRoom) return;
    const roomId = currentRoom.id;

    // Remove self from members
    await supabase.from("room_members").delete()
      .eq("room_id", roomId)
      .eq("username", username);

    // Check remaining members
    const { count } = await supabase
      .from("room_members")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId);

    // If no members left, delete room (cascade deletes messages)
    if (count === 0) {
      await supabase.from("messages").delete().eq("room_id", roomId);
      await supabase.from("rooms").delete().eq("id", roomId);
    }

    setCurrentRoom(null);
    setMessages([]);
  }, [currentRoom, username]);

  const sendMessage = useCallback(async (text: string) => {
    if (!currentRoom || !text.trim()) return;
    await supabase.from("messages").insert({
      room_id: currentRoom.id,
      sender: username,
      text: text.trim(),
    });
  }, [currentRoom, username]);

  return (
    <ChatContext.Provider value={{ username, setUsername, currentRoom, messages, memberCount, createRoom, joinRoom, leaveRoom, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};
