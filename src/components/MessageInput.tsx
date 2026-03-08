import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSend: (text: string) => void;
}

export const MessageInput = ({ onSend }: MessageInputProps) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
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
        onChange={(e) => setText(e.target.value)}
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
