const PLACEHOLDER_MARKERS = ['your_', 'your-', 'your ', '<', '>', 'placeholder'] as const;

export function isPlaceholderConfigValue(value: string | undefined | null): boolean {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return PLACEHOLDER_MARKERS.some((marker) => normalized.includes(marker));
}

export function hasConfiguredValue(value: string | undefined | null): value is string {
  return !isPlaceholderConfigValue(value);
}
