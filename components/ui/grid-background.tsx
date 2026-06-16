import { cn } from "@/lib/utils";

export function GridBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10",
        "bg-[linear-gradient(to_right,rgba(0,128,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,128,255,0.06)_1px,transparent_1px)]",
        "bg-[size:48px_48px]",
        "mask-[radial-gradient(ellipse_at_center,black_20%,transparent_75%)]",
        className,
      )}
    />
  );
}
