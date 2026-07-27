'use client';

export default function SearchButton() {
  const handleClick = () => {
    // Dispatch Cmd+K to open global SearchModal
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
    );
  };

  return (
    <button
      onClick={handleClick}
      className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-border/40 transition-all"
      aria-label="Search"
      title="Search (Cmd+K)"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
        />
      </svg>
    </button>
  );
}
