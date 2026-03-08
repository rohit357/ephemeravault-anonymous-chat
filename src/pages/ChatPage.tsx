import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useChatContext } from "@/context/ChatContext";
import { ChatBubble } from "@/components/ChatBubble";
import { MessageInput } from "@/components/MessageInput";
import { ArrowLeft, Users } from "lucide-react";

const ChatPage = () => {
  const { username, getCurrentRoom, sendMessage, leaveRoom } = useChatContext();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const room = getCurrentRoom();

  useEffect(() => {
    if (!room) {
      navigate("/lobby");
    }
  }, [room, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [room?.messages.length]);

  const handleLeave = () => {
    leaveRoom();
    navigate("/lobby");
  };

  if (!room) return null;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={handleLeave} className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-all">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{room.name}</h2>
          <p className="text-xs text-muted-foreground font-mono">{room.code}</p>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span className="text-xs">{room.members.length}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {room.messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">No messages yet. Say hello! 👋</p>
          </div>
        )}
        {room.messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} isSelf={msg.sender === username} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={sendMessage} />
    </div>
  );
};

export default ChatPage;
