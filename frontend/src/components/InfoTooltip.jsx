import { useState } from "react";

export default function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => {
          e.stopPropagation();
          setShow((s) => !s);
        }}
        className="w-3.5 h-3.5 rounded-full bg-ink/10 text-ink/50 text-[9px] font-bold flex items-center justify-center hover:bg-signal/20 hover:text-signal-dark transition-colors"
        aria-label="More info"
      >
        i
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-ink text-paper text-[11px] leading-snug rounded-lg px-3 py-2 shadow-lg z-50 normal-case font-normal">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ink" />
        </span>
      )}
    </span>
  );
}