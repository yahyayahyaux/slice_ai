import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline-dark";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

const sizes = {
  xs: "px-2.5 py-1.5 text-xs rounded-lg",
  sm: "px-3 py-2 text-sm rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-xl",
  icon: "p-2 rounded-lg"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
        variant === "primary" && "bg-ink text-bg hover:opacity-85 shadow-card",
        variant === "secondary" && "border border-border bg-raised text-ink hover:bg-surface",
        variant === "ghost" && "text-ink hover:bg-surface",
        variant === "danger" && "bg-danger text-white hover:opacity-85",
        variant === "outline-dark" && "border border-ink bg-transparent text-ink hover:bg-ink hover:text-bg",
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
