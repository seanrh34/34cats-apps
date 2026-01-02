"use client";

import { Button } from "@/components/ui/button";

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
      className="fixed bottom-8 right-8 z-50 rounded-full w-12 h-12 flex items-center justify-center shadow-lg bg-[#E84A3A] border-2 border-gray-600 hover:border-gray-600 transition-all transform hover:-translate-y-0.5 cursor-pointer"
      title="Scroll to bottom"
    >
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
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
