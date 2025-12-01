import { App } from "@/lib/types";
import Link from "next/link";

interface AppCardProps {
  app: App;
}

export function AppCard({ app }: AppCardProps) {
  const isLive = app.status === "Live";
  
  return (
    <Link
      href={isLive ? app.href : "#"}
      className={`group block p-6 rounded-xl border border-gray-800 bg-gray-800/30 hover:bg-gray-800/50 transition-all ${
        isLive ? "hover:border-[#E84A3A] hover:shadow-lg hover:shadow-[#E84A3A]/10 cursor-pointer" : "cursor-not-allowed opacity-75"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-4xl">{app.icon}</div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            isLive
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
          }`}
        >
          {app.status}
        </span>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-[#E84A3A] transition-colors">
        {app.name}
      </h3>
      <p className="text-gray-400 text-sm">{app.description}</p>
      {isLive && (
        <div className="mt-4 flex items-center text-[#E84A3A] text-sm font-medium">
          Launch App
          <svg
            className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      )}
    </Link>
  );
}
