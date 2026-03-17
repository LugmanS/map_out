import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { query } from "@/lib/agent";
import { useChatStore } from "@/lib/store";
import { ArrowUp } from "lucide-react";
import { useState } from "react";

export default function App() {
  const { addChatMessage } = useChatStore();
  const [input, setInput] = useState("");

  function sendMessage() {
    const msgId = addChatMessage(input);
    query(input, msgId);
    setInput("");
  }

  return (
    <main className="min-h-screen bg-card">
      <nav className="h-16 w-full fixed top-0 left-0 bg-card/60 backdrop-blur-2xl z-50">
        <div className="flex items-center justify-between px-4 h-full max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" className="size-8 hover:animate-spin" />
            <div>
              <h1 className="font-mono">map_out</h1>
              <p className="text-xs text-muted-foreground">by Madhi AI</p>
            </div>
          </div>
          <Button variant={"secondary"}>New Chat</Button>
        </div>
      </nav>
      <div className="max-w-3xl w-full mx-auto fixed bottom-0 bg-card left-1/2 transform translate-x-[-50%] z-50 pb-3.5">
        <div className="p-2 border rounded-xl bg-muted">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (e.shiftKey) {
                  return;
                }
                e.preventDefault();
                sendMessage();
              }
            }}
            autoFocus
            className="border-0 bg-transparent dark:bg-transparent shadow-none focus-visible:ring-0 resize-none"
            placeholder="How can I help you?"
          />
          <div className="flex items-center justify-end">
            <Button
              size={"icon"}
              disabled={input.length === 0}
              onClick={() => sendMessage()}
            >
              <ArrowUp />
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
