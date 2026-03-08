import { useState, KeyboardEvent, useRef } from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSend: (text: string) => void;
  onTyping?: (isTyping: boolean) => void;
}

export const MessageInput = ({ onSend, onTyping }: MessageInputProps) => {
  const [text, setText] = useState("");
  const wasTypingRef = useRef(false);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
    wasTypingRef.current = false;
    onTyping?.(false);
  };

  const handleChange = (value: string) => {
    setText(value);
    const isTyping = value.trim().length > 0;
    if (isTyping !== wasTypingRef.current) {
      wasTypingRef.current = isTyping;
      onTyping?.(isTyping);
    }
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-3 p-4 border-t border-border bg-card">
      <input
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Type a message..."
        className="flex-1 bg-muted text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-all"
      />
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        className="p-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 transition-all"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
};
