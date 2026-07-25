/**
 * Cross-component route aliasing helpers.
 *
 * Sidebar, MobileNav, and TopBar each render a navigation surface
 * keyed on the current `route` value coming from App.tsx. App.tsx
 * already normalises URL hashes to the canonical id on init, but
 * other state paths can still surface an aliased value (extension
 * link, hot nav, direct setRoute, etc.). Centralising the alias
 * map and the comparison helper here means every nav surface stays
 * in sync when a new alias is added: register once here, every
 * nav surface picks it up automatically.
 */

/**
 * Map of canonical route id -> every value that should be treated
 * as the same route for nav highlighting purposes.
 */
export const ROUTE_ALIASES: Record<string, string[]> = {
  apikeys: ["apikeys", "api-keys"],
};

/**
 * Tolerant comparison: returns true if `itemId` is the current
 * `route` OR if they share at least one alias entry on either
 * side (handles single-sided aliases without NPE).
 */
export function isActiveRoute(itemId: string, route: string): boolean {
  if (itemId === route) return true;
  const items = ROUTE_ALIASES[itemId] ?? [itemId];
  const routes = ROUTE_ALIASES[route] ?? [route];
  return items.some((i) => routes.includes(i));
}
