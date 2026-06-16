import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent-success)] text-white hover:opacity-90 hover:-translate-y-px",
        secondary:
          "bg-[var(--neon-primary)]/15 text-[var(--text-primary)] border border-[var(--neon-primary)]/40 hover:bg-[var(--neon-primary)]/25",
        ghost:
          "text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]",
        destructive: "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { buttonVariants };
