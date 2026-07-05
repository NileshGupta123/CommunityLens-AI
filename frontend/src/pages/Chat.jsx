import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../services/api";

const SUGGESTED_QUESTIONS = [
  "Which area has the worst air quality right now?",
  "Where should I avoid due to traffic?",
  "Which hospitals have beds available?",
  "Give me today's overall city summary.",
];

const SOURCE_LABEL = {
  gemini: { text: "via Gemini", color: "text-safe" },
  groq: { text: "via Groq (fallback)", color: "text-signal-dark" },
};

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm CommunityLens AI. Ask me anything about live air quality, traffic, or hospital availability across Mumbai.",
      source: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [recentSources, setRecentSources] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, []);

  function toggleVoiceInput() {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }

  async function handleSend(text) {
    const messageText = text || input;
    if (!messageText.trim() || sending) return;

    const historyForApi = messages.map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, { role: "user", text: messageText }]);
    setInput("");
    setSending(true);

    try {
      const res = await sendChatMessage(messageText, historyForApi);
      setMessages((prev) => [...prev, { role: "assistant", text: res.reply, source: res.source }]);
      setRecentSources((prev) => [...prev, res.source].slice(-5));
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, I couldn't reach the AI service. Please try again.", source: null },
      ]);
    } finally {
      setSending(false);
    }
  }

  const lastSource = recentSources[recentSources.length - 1];
  const statusLabel =
    lastSource === "groq"
      ? { text: "Gemini Degraded — Groq Active", color: "bg-signal/10 text-signal-dark" }
      : lastSource === "gemini"
      ? { text: "Gemini Operational", color: "bg-safe/10 text-safe" }
      : { text: "AI Status: Idle", color: "bg-ink/5 text-slate-muted" };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 md:py-12 flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink mb-1">
            AI Chat Assistant
          </h1>
          <p className="text-sm text-ink/60">
            Grounded in live city data, with automatic Gemini → Groq fallback.
          </p>
        </div>
        <span className={`text-[10px] font-mono uppercase px-3 py-1.5 rounded-full whitespace-nowrap ${statusLabel.color}`}>
          {statusLabel.text}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%]">
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-ink text-paper rounded-br-sm"
                    : "bg-white border border-ink/10 text-ink rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
              {msg.source && (
                <p className={`text-[10px] font-mono mt-1 ml-1 ${SOURCE_LABEL[msg.source]?.color || "text-slate-muted"}`}>
                  {SOURCE_LABEL[msg.source]?.text || msg.source}
                </p>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-ink/10 px-4 py-3 rounded-2xl rounded-bl-sm">
              <span className="font-mono text-sm text-slate-muted animate-pulse">thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="text-xs px-3 py-2 rounded-full border border-ink/15 text-ink/70 hover:border-signal hover:text-signal transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? "Listening..." : "Ask about air quality, traffic, or hospitals..."}
          className="flex-1 px-4 py-3 rounded-lg border border-ink/20 bg-white focus:outline-none focus:border-signal text-sm"
        />
        {recognitionRef.current && (
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`px-4 py-3 rounded-lg border transition-colors ${
              isListening
                ? "bg-risk/10 border-risk text-risk animate-pulse"
                : "border-ink/20 text-ink/60 hover:border-signal hover:text-signal"
            }`}
            title="Voice input"
          >
            🎤
          </button>
        )}
        <button
          type="submit"
          disabled={sending}
          className="px-6 py-3 bg-ink text-paper rounded-lg font-medium hover:bg-ink-light transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}