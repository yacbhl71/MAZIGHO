function expandHexColor(value: string) {
  const normalized = value.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(normalized)) {
    return `#${normalized.slice(1).split("").map(channel => `${channel}${channel}`).join("")}`;
  }
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : null;
}

function relativeLuminance(hex: string) {
  const channels = [1, 3, 5].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const [red, green, blue] = channels.map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function getColorContrastRatio(background: string, foreground: string) {
  const normalizedBackground = expandHexColor(background);
  const normalizedForeground = expandHexColor(foreground);
  if (!normalizedBackground || !normalizedForeground) return null;
  const [lighter, darker] = [relativeLuminance(normalizedBackground), relativeLuminance(normalizedForeground)].sort((left, right) => right - left);
  return (lighter + 0.05) / (darker + 0.05);
}

export function hasReadableTextContrast(background: string, foreground: string) {
  const ratio = getColorContrastRatio(background, foreground);
  return ratio !== null && ratio >= 4.5;
}
