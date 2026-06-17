interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-mono text-2xl font-semibold text-[var(--text-primary)]">
        {title}
      </h1>
      <p className="mt-2 text-[var(--text-muted)]">{description}</p>
      <span className="mt-6 inline-block rounded-full border border-[var(--neon-primary)]/30 bg-[var(--neon-primary)]/10 px-3 py-1 font-mono text-xs tracking-wide text-[var(--neon-primary)]">
        Coming soon
      </span>
    </div>
  );
}
