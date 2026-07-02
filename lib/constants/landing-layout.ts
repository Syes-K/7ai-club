/** Shared horizontal rhythm for landing page (header, hero, grid, footer). */
export const landingContainerClass =
  "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 xl:max-w-7xl";

/**
 * Hero + capability grid as one vertical block: fills space between header and footer,
 * centers as a unit, and distributes gap between the two sections.
 */
export const landingMainContentClass =
  `${landingContainerClass} flex flex-1 flex-col justify-center gap-10 py-10 sm:gap-12 sm:py-12 lg:gap-14 lg:py-14 xl:gap-16 xl:py-16`;

/** @deprecated Alias — prefer landingMainContentClass for hero + grid wrapper. */
export const landingHeroColumnClass = landingContainerClass;
