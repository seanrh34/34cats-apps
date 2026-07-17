import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#E84A3A]/70 focus:ring-offset-2 focus:ring-offset-[#0b0d12] disabled:cursor-not-allowed disabled:opacity-45";

    const variants = {
      primary:
        "border border-[#E84A3A] bg-[#E84A3A] text-white shadow-sm hover:bg-[#d94334]",
      secondary:
        "border border-white/10 bg-white/[0.055] text-gray-200 hover:border-white/15 hover:bg-white/[0.09]",
      outline:
        "border border-white/15 bg-transparent text-gray-200 hover:border-white/25 hover:bg-white/[0.06] hover:text-white",
      ghost:
        "bg-transparent text-gray-400 hover:bg-white/[0.06] hover:text-white",
    };

    const sizes = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-2.5 text-sm",
      lg: "px-5 py-3 text-base",
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          isLoading && "opacity-70 cursor-wait",
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
