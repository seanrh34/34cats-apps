interface PageHeaderProps {
  badge?: {
    text: string;
    variant?: "success" | "warning" | "info";
  };
  title: string;
  description: string;
  className?: string;
}

export function PageHeader({ badge, title, description, className = "" }: PageHeaderProps) {
  const badgeVariants = {
    success: "bg-green-500/10 text-green-400 border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <div className={`text-center mb-12 ${className}`}>
      {badge && (
        <div
          className={`inline-block mb-4 px-4 py-2 rounded-full text-sm font-medium border ${
            badgeVariants[badge.variant || "info"]
          }`}
        >
          {badge.text}
        </div>
      )}
      <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
        {title}
      </h1>
      <p className="text-xl text-gray-300 max-w-2xl mx-auto">
        {description}
      </p>
    </div>
  );
}
