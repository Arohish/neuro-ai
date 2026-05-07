import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { chatHealthAssistant } from "@/lib/api";

export const Route = createFileRoute("/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant · NeuroSense" }, { name: "description", content: "Ask the AI healthcare assistant about Parkinson's symptoms and analysis results." }] }),
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm your NeuroSense assistant. Ask me about Parkinson's symptoms, how the AI works, or how to interpret your results.\n\n_This is not a medical diagnosis._" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: input }];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const reply = await chatHealthAssistant(next);
      setMessages([...next, { role: "assistant", content: reply }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-3xl flex-col px-6 py-10">
      <header className="mb-4">
        <h1 className="text-3xl font-bold">AI Health Assistant</h1>
        <p className="mt-1 text-sm text-muted-foreground">General Parkinson's information. Not a diagnosis.</p>
      </header>
      <Card className="flex flex-1 flex-col overflow-hidden border-border bg-card">
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}>{m.content}</div>
            </div>
          ))}
          {loading && <div className="text-sm text-muted-foreground">Thinking…</div>}
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-border p-4">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about symptoms or results…" />
          <Button type="submit" disabled={loading} className="gap-2"><Send className="h-4 w-4" /> Send</Button>
        </form>
      </Card>
    </div>
  );
}
