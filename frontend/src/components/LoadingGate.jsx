import { useState, useEffect } from "react";
import { checkHealth } from "../services/api";

export default function LoadingGate({ children }) {
  const [ready, setReady] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const tick = setInterval(() => {
      if (!cancelled) setSeconds((s) => s + 1);
    }, 1000);

    async function poll() {
      attempts += 1;
      try {
        await checkHealth();
        if (!cancelled) setReady(true);
      } catch {
        if (attempts >= 40) {
          // ~40 * 2s = 80s ceiling before giving up on the friendly wait
          if (!cancelled) setFailed(true);
          return;
        }
        setTimeout(poll, 2000);
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearInterval(tick);
    };
  }, []);

  if (ready) return children;

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-2.5 h-2.5 rounded-full bg-signal animate-pulse" />
          <span className="font-display font-semibold text-lg text-ink">
            CommunityLens<span className="text-signal">AI</span>
          </span>
        </div>

        {!failed ? (
          <>
            <div className="w-10 h-10 border-3 border-ink/10 border-t-signal rounded-full animate-spin mx-auto mb-5" />
            <p className="font-medium text-ink mb-2">Waking up the server...</p>
            <p className="text-sm text-ink/60 leading-relaxed">
              This app runs on free hosting, which puts the backend to sleep after inactivity.
              First load can take up to a minute &#8212; it's not frozen, just starting up.
            </p>
            <p className="text-xs font-mono text-slate-muted mt-4">{seconds}s elapsed</p>
          </>
        ) : (
          <>
            <p className="font-medium text-risk mb-2">Taking longer than expected</p>
            <p className="text-sm text-ink/60 leading-relaxed mb-4">
              The backend didn't respond in time. It may be temporarily down, or your connection
              might be having trouble reaching it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-ink text-paper rounded-lg text-sm font-medium hover:bg-ink-light transition-colors"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}