import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F8FAFC] placeholder:text-[#F8FAFC]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
