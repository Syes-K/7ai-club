import { ConsolePage } from "@/components/console/console-page";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <ConsolePage title={title} description={description}>
      <span className="mt-6 inline-block rounded-full border border-[var(--neon-primary)]/30 bg-[var(--neon-primary)]/10 px-3 py-1 font-mono text-xs tracking-wide text-[var(--neon-primary)]">
        Coming soon
      </span>
    </ConsolePage>
  );
}
