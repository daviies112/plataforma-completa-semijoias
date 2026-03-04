/**
 * Shared tenant utility functions — no circular dependencies.
 * Import from here instead of leadJourneyAggregator when you need getTenantLookupList.
 */

/**
 * Returns all slug variants for a given tenantId so that queries using `.in()` find
 * records regardless of which historical variant was used when inserting data.
 *
 * Examples:
 *   'emericks'        → ['emericks', 'emericks-tenant', 'emerick', 'emerick-tenant']
 *   'emericks-tenant' → ['emericks-tenant', 'emericks', 'emerick', 'emerick-tenant']
 *   'emerick'         → ['emerick', 'emerick-tenant', 'emericks', 'emericks-tenant']
 *   'davisemijoias'   → ['davisemijoias', 'davisemijoias-tenant', ...]
 */
export function getTenantLookupList(tenantId: string): string[] {
  const variants = new Set<string>();
  variants.add(tenantId);

  // Derive the base name (strip '-tenant' suffix if present)
  const baseName = tenantId.endsWith('-tenant')
    ? tenantId.replace(/-tenant$/, '')
    : tenantId;

  // Always include both with and without '-tenant' suffix
  variants.add(baseName);
  variants.add(baseName + '-tenant');

  // Trailing-s variant: 'emericks' ↔ 'emerick'
  if (baseName.endsWith('s') && baseName.length > 3) {
    const stripped = baseName.slice(0, -1);
    variants.add(stripped);
    variants.add(stripped + '-tenant');
  } else if (baseName.length > 2) {
    const withS = baseName + 's';
    variants.add(withS);
    variants.add(withS + '-tenant');
  }

  return [...variants].filter(v => v.length > 2);
}
