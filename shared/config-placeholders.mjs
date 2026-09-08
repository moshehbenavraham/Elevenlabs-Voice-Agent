const PLACEHOLDER_MARKERS = ['your_', 'your-', 'your ', '<', '>', 'placeholder', 'example.com'];

/** Return true when a runtime value is non-empty and does not look like setup guidance. */
export function hasConfiguredValue(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return (
    normalized.length > 0 && !PLACEHOLDER_MARKERS.some((marker) => normalized.includes(marker))
  );
}
