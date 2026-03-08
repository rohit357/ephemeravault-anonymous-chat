import { Message } from "@/context/ChatContext";

interface ChatBubbleProps {
  message: Message;
  isSelf: boolean;
}

export const ChatBubble = ({ message, isSelf }: ChatBubbleProps) => {
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex ${isSelf ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
        isSelf
          ? "bg-chat-self text-chat-self-foreground rounded-br-md"
          : "bg-chat-other text-chat-other-foreground rounded-bl-md"
      }`}>
        {!isSelf && (
          <p className="text-xs font-medium text-primary mb-1">{message.sender}</p>
        )}
        <p className="text-sm leading-relaxed break-words">{message.text}</p>
        <p className={`text-[10px] mt-1 ${isSelf ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
          {time}
        </p>
      </div>
    </div>
  );
};
