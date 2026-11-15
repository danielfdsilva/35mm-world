/** Reads a theme token from :root, for components that need raw values. */
export const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();
