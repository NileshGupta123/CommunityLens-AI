import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { sendChatMessage } from "../services/api";

const SOURCE_LABEL = {
  gemini: "via Gemini",
  groq: "via Groq (fallback)",
};

export default function FloatingChat() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Ask me about any area's air quality, traffic, or hospitals.", source: null },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Don't show the floating widget on the full Chat page - it'd be redundant
  if (location.pathname === "/chat") return null;

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const res = await sendChatMessage(text, history);
      setMessages((prev) => [...prev, { role: "assistant", text: res.reply, source: res.source }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, I couldn't reach the AI service.", source: null },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[100]">
      {open && (
        <div className="mb-3 w-80 sm:w-96 h-[28rem] bg-white rounded-2xl border border-ink/10 shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-ink text-paper px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
              <span className="font-display font-semibold text-sm">CommunityLens AI</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-paper/70 hover:text-paper text-lg leading-none">
              &times;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%]">
                  <div
                    className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-ink text-paper rounded-br-sm"
                        : "bg-paper border border-ink/10 text-ink rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.source && (
                    <p className="text-[9px] font-mono text-slate-muted mt-0.5 ml-1">
                      {SOURCE_LABEL[msg.source] || msg.source}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-paper border border-ink/10 px-3 py-2 rounded-xl">
                  <span className="text-xs text-slate-muted animate-pulse font-mono">thinking...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="border-t border-ink/10 p-2 flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-ink/15 focus:outline-none focus:border-signal"
            />
            <button
              type="submit"
              disabled={sending}
              className="px-3 py-2 bg-ink text-paper rounded-lg text-xs font-medium disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 rounded-full bg-ink text-paper shadow-lg hover:bg-ink-light transition-colors flex items-center justify-center"
        aria-label="Toggle AI assistant"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </div>
  );
}