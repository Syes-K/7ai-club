import Link from "next/link";
import {
  LANDING_CAPABILITIES,
  type LandingCapability,
} from "@/lib/constants/landing";
import { cn } from "@/lib/utils";

const CAPABILITY_TITLE_CLASS = "text-[#64748b]";
const CAPABILITY_TITLE_ROADMAP_CLASS = "text-[#64748b]/65";

function CapabilityLabel({ item }: { item: LandingCapability }) {
  const isRoadmap = !item.href;

  return (
    <span className="block font-mono text-xs tracking-wide">
      <span className="opacity-70" style={{ color: item.accent }}>
        [{item.id}]
      </span>{" "}
      <span
        className={cn(
          isRoadmap ? CAPABILITY_TITLE_ROADMAP_CLASS : CAPABILITY_TITLE_CLASS,
        )}
      >
        {item.title}
      </span>
    </span>
  );
}

function CapabilityCard({ item }: { item: LandingCapability }) {
  const isLink = Boolean(item.href);

  const className = cn(
    "flex min-h-[2.75rem] items-center rounded-md border border-white/5 px-3 py-2.5 transition-colors sm:min-h-[3rem] sm:px-4 sm:py-3 lg:min-h-[3.5rem] lg:px-5 lg:py-4 xl:min-h-[4rem] xl:px-6 xl:py-4",
    isLink
      ? "hover:border-white/10 hover:bg-white/[0.02]"
      : "cursor-default",
  );

  if (isLink) {
    return (
      <Link href={item.href!} className={className}>
        <CapabilityLabel item={item} />
      </Link>
    );
  }

  return (
    <div className={className}>
      <CapabilityLabel item={item} />
    </div>
  );
}

export function CapabilityGrid() {
  return (
    <section className="w-full">
      <ul className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-4 xl:gap-5">
        {LANDING_CAPABILITIES.map((item) => (
          <li key={item.id}>
            <CapabilityCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}
