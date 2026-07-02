export type LandingCapability = {
  id: string;
  title: string;
  /** Omit for roadmap items (non-clickable, dashed border) */
  href?: string;
  accent: string;
};

/** Ordered by importance / visual weight (01 = primary entry). */
export const LANDING_CAPABILITIES: LandingCapability[] = [
  {
    id: "01",
    title: "Streaming & models",
    href: "/chat",
    accent: "var(--neon-primary)",
  },
  {
    id: "02",
    title: "Knowledge & routing",
    href: "/console/knowledge",
    accent: "var(--accent-success)",
  },
  {
    id: "03",
    title: "Assistant & personas",
    href: "/console/assistants",
    accent: "#a855f7",
  },
  {
    id: "04",
    title: "Workflow & steps",
    href: "/chat",
    accent: "var(--neon-secondary)",
  },
  {
    id: "05",
    title: "Prompts & configs",
    href: "/console/models",
    accent: "#06b6d4",
  },
  {
    id: "06",
    title: "MCP & tools",
    accent: "#64748b",
  },
];

export const LANDING_COPY = {
  brand: "7AI·CLUB",
  eyebrow: "PERSONAL · AI LEARNING",
  headline: "CRACK THE STACK",
  tagline: "DECONSTRUCT · LEARN · BREAK THINGS",
  value: "Play first. Pitch never. Break things on purpose.",
  cta: "Start chat",
  footer: "SYS://local · learning mode · no warranty",
} as const;
