import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChatContext } from "@/context/ChatContext";
import { MessageCircle } from "lucide-react";

const WelcomePage = () => {
  const [name, setName] = useState("");
  const { setUsername } = useChatContext();
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!name.trim()) return;
    setUsername(name.trim());
    navigate("/lobby");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">EphemeraVault 🔐</h1>
          <p className="text-sm text-muted-foreground mt-1">Temporary rooms. No trace.</p>
          <p className="text-[10px] text-muted-foreground/50 mt-2">by Rohit Sharma</p>
        </div>

        <div className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleContinue()}
            placeholder="Enter your name"
            maxLength={20}
            className="w-full bg-card text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3.5 text-sm outline-none border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <button
            onClick={handleContinue}
            disabled={!name.trim()}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-30 transition-all"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
