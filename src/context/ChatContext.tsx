import React, { createContext, useContext, useState, useCallback } from "react";
import { Message, Room } from "@/types/chat";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 12);
}

interface ChatContextType {
  username: string;
  setUsername: (name: string) => void;
  rooms: Map<string, Room>;
  currentRoom: string | null;
  createRoom: (name: string) => string;
  joinRoom: (code: string) => boolean;
  leaveRoom: () => void;
  sendMessage: (text: string) => void;
  getCurrentRoom: () => Room | null;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChatContext = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState("");
  const [rooms, setRooms] = useState<Map<string, Room>>(new Map());
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  const createRoom = useCallback((name: string) => {
    const code = generateCode();
    const room: Room = { code, name, messages: [], members: [username] };
    setRooms((prev) => new Map(prev).set(code, room));
    setCurrentRoom(code);
    return code;
  }, [username]);

  const joinRoom = useCallback((code: string) => {
    const upperCode = code.toUpperCase();
    setRooms((prev) => {
      const map = new Map(prev);
      const room = map.get(upperCode);
      if (room) {
        if (!room.members.includes(username)) {
          room.members = [...room.members, username];
        }
        map.set(upperCode, { ...room });
      }
      return map;
    });
    const exists = rooms.has(upperCode);
    if (exists) setCurrentRoom(upperCode);
    return exists;
  }, [rooms, username]);

  const leaveRoom = useCallback(() => {
    if (!currentRoom) return;
    setRooms((prev) => {
      const map = new Map(prev);
      const room = map.get(currentRoom);
      if (room) {
        room.members = room.members.filter((m) => m !== username);
        // Clear messages for this user's perspective (temporary chats)
        if (room.members.length === 0) {
          map.delete(currentRoom);
        } else {
          map.set(currentRoom, { ...room });
        }
      }
      return map;
    });
    setCurrentRoom(null);
  }, [currentRoom, username]);

  const sendMessage = useCallback((text: string) => {
    if (!currentRoom || !text.trim()) return;
    const msg: Message = { id: generateId(), sender: username, text: text.trim(), timestamp: Date.now() };
    setRooms((prev) => {
      const map = new Map(prev);
      const room = map.get(currentRoom);
      if (room) {
        map.set(currentRoom, { ...room, messages: [...room.messages, msg] });
      }
      return map;
    });
  }, [currentRoom, username]);

  const getCurrentRoom = useCallback(() => {
    if (!currentRoom) return null;
    return rooms.get(currentRoom) || null;
  }, [currentRoom, rooms]);

  return (
    <ChatContext.Provider value={{ username, setUsername, rooms, currentRoom, createRoom, joinRoom, leaveRoom, sendMessage, getCurrentRoom }}>
      {children}
    </ChatContext.Provider>
  );
};
