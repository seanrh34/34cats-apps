"use client";

export function ScrollToBottomButton() {
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToBottom}
      title="Scroll to bottom"
      className="fixed right-6 bottom-6 z-50 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-line-strong bg-ink-raised text-ash transition-colors hover:border-ember hover:text-ember"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );
}
