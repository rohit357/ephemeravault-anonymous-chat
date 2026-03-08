import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChatContext } from "@/context/ChatContext";
import { Plus, LogIn, Copy, Check } from "lucide-react";

const LobbyPage = () => {
  const { username, createRoom, joinRoom } = useChatContext();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"idle" | "create" | "join">("idle");
  const [roomName, setRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createdCode, setCreatedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = () => {
    if (!roomName.trim()) return;
    const code = createRoom(roomName.trim());
    setCreatedCode(code);
  };

  const handleEnterRoom = () => {
    navigate("/chat");
  };

  const handleJoin = () => {
    setError("");
    if (!joinCode.trim()) return;
    const ok = joinRoom(joinCode.trim());
    if (ok) {
      navigate("/chat");
    } else {
      setError("Room not found. Check the code.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-slide-up">
        <p className="text-muted-foreground text-sm mb-1">Hey,</p>
        <h1 className="text-2xl font-bold text-foreground mb-8">{username}</h1>

        {mode === "idle" && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("create")}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Create Room</p>
                <p className="text-xs text-muted-foreground">Start a new private room</p>
              </div>
            </button>

            <button
              onClick={() => setMode("join")}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <LogIn className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Join Room</p>
                <p className="text-xs text-muted-foreground">Enter a room code</p>
              </div>
            </button>
          </div>
        )}

        {mode === "create" && !createdCode && (
          <div className="space-y-4 animate-fade-in">
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Room name"
              maxLength={30}
              className="w-full bg-card text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3.5 text-sm outline-none border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <div className="flex gap-2">
              <button onClick={() => setMode("idle")} className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-80 transition-all">
                Back
              </button>
              <button onClick={handleCreate} disabled={!roomName.trim()} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-30 transition-all">
                Create
              </button>
            </div>
          </div>
        )}

        {mode === "create" && createdCode && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <p className="text-xs text-muted-foreground mb-2">Room Code</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-3xl font-mono font-bold tracking-[0.3em] text-primary">{createdCode}</p>
                <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-secondary transition-all">
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Share this code with others to join</p>
            </div>
            <button onClick={handleEnterRoom} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
              Enter Room
            </button>
          </div>
        )}

        {mode === "join" && (
          <div className="space-y-4 animate-fade-in">
            <input
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="Enter room code"
              maxLength={6}
              className="w-full bg-card text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-3.5 text-sm font-mono tracking-widest text-center outline-none border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all uppercase"
            />
            {error && <p className="text-xs text-destructive text-center">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setMode("idle"); setError(""); }} className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-80 transition-all">
                Back
              </button>
              <button onClick={handleJoin} disabled={!joinCode.trim()} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-30 transition-all">
                Join
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LobbyPage;
