const PLACEHOLDER_MARKERS = [
  'your_',
  'your-',
  'your ',
  '<',
  '>',
  'placeholder',
  'example.com',
] as const;

/** Return true when a value is empty or resembles setup guidance. */
export function isPlaceholderConfigValue(value: string | undefined | null): boolean {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return PLACEHOLDER_MARKERS.some((marker) => normalized.includes(marker));
}

/** Return true when a client configuration value is usable at runtime. */
export function hasConfiguredValue(value: string | undefined | null): value is string {
  return !isPlaceholderConfigValue(value);
}
