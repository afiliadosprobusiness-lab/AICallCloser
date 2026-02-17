export function AIThinkingIndicator() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#E5C76B]/25 bg-[#141414]/70 px-3 py-1.5 text-xs text-[#D8D3C7]">
      <span className="ai-pulse inline-block h-2 w-2 rounded-full bg-[#E5C76B]" />
      IA procesando
    </div>
  );
}
