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
  typingUsers: string[];
  createRoom: (name: string) => Promise<Room>;
  joinRoom: (code: string) => Promise<Room | null>;
  leaveRoom: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
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
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const upsertMessages = useCallback((incoming: Message[]) => {
    setMessages((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m] as const));
      incoming.forEach((msg) => byId.set(msg.id, msg));
      return Array.from(byId.values()).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  }, []);

  const fetchMemberCount = useCallback(async (roomId: string) => {
    const { count } = await supabase
      .from("room_members")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId);
    setMemberCount(count ?? 0);
  }, []);

  useEffect(() => {
    if (!currentRoom) {
      setMessages([]);
      setMemberCount(0);
      setTypingUsers([]);
      return;
    }

    setMessages([]);
    setTypingUsers([]);
    let isActive = true;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender, text, created_at")
        .eq("room_id", currentRoom.id)
        .order("created_at", { ascending: true });

      if (!isActive || !data) return;
      upsertMessages(data as Message[]);
    };

    fetchMessages();
    fetchMemberCount(currentRoom.id);

    const channel = supabase
      .channel(`room-${currentRoom.id}`, { config: { broadcast: { self: true } } })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${currentRoom.id}` },
        (payload) => {
          const msg = payload.new as Message;
          upsertMessages([msg]);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${currentRoom.id}` },
        () => {
          fetchMemberCount(currentRoom.id);
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        const user = payload.payload?.username as string;
        const isTyping = payload.payload?.isTyping as boolean;
        setTypingUsers((prev) => {
          if (isTyping && !prev.includes(user)) return [...prev, user];
          if (!isTyping) return prev.filter((u) => u !== user);
          return prev;
        });
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          fetchMessages();
        }
      });

    channelRef.current = channel;

    const pollId = setInterval(() => {
      fetchMessages();
      fetchMemberCount(currentRoom.id);
    }, 3000);

    return () => {
      isActive = false;
      clearInterval(pollId);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [currentRoom?.id, fetchMemberCount, upsertMessages]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { username, isTyping },
    });

    // Auto-stop typing after 3s
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        channelRef.current?.send({
          type: "broadcast",
          event: "typing",
          payload: { username, isTyping: false },
        });
      }, 3000);
    }
  }, [username]);

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

    await supabase.from("room_members").delete()
      .eq("room_id", roomId)
      .eq("username", username);

    const { count } = await supabase
      .from("room_members")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId);

    if (count === 0) {
      await supabase.from("messages").delete().eq("room_id", roomId);
      await supabase.from("rooms").delete().eq("id", roomId);
    }

    setCurrentRoom(null);
    setMessages([]);
    setTypingUsers([]);
  }, [currentRoom, username]);

  const sendMessage = useCallback(async (text: string) => {
    if (!currentRoom || !text.trim()) return;
    setTyping(false);
    await supabase.from("messages").insert({
      room_id: currentRoom.id,
      sender: username,
      text: text.trim(),
    });
  }, [currentRoom, username, setTyping]);

  return (
    <ChatContext.Provider value={{ username, setUsername, currentRoom, messages, memberCount, typingUsers, createRoom, joinRoom, leaveRoom, sendMessage, setTyping }}>
      {children}
    </ChatContext.Provider>
  );
};
