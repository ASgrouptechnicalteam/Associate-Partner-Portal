export const calculatePlotPolygon = (
  north: number | string | null | undefined,
  south: number | string | null | undefined,
  east: number | string | null | undefined,
  west: number | string | null | undefined,
  baseWidth: number,
  baseHeight: number
): number[] => {
  // Safely parse values, fallback to 0 if invalid
  const n = parseFloat(String(north)) || 0;
  const s = parseFloat(String(south)) || 0;
  const e = parseFloat(String(east)) || 0;
  const w = parseFloat(String(west)) || 0;

  // If all lengths are 0 or missing, render a standard rectangle using the base visual dimensions
  if (n === 0 && s === 0 && e === 0 && w === 0) {
    return [0, 0, baseWidth, 0, baseWidth, baseHeight, 0, baseHeight];
  }

  // To prevent zero-length calculations causing Infinity or division by zero,
  // we fallback any 0 length to its opposite side, or finally the base visual dimension.
  const finalN = n || s || baseWidth;
  const finalS = s || n || baseWidth;
  const finalE = e || w || baseHeight;
  const finalW = w || e || baseHeight;

  const maxHoriz = Math.max(finalN, finalS);
  const maxVert = Math.max(finalE, finalW);

  // Normalize the physical dimensions to fit inside the visual bounding box
  const topVis = (finalN / maxHoriz) * baseWidth;
  const botVis = (finalS / maxHoriz) * baseWidth;
  const leftVis = (finalW / maxVert) * baseHeight;
  const rightVis = (finalE / maxVert) * baseHeight;

  // Calculate 4 corners that center the shape symmetrically inside the bounding box.
  // This creates a stable approximation of an irregular quadrilateral preserving relative lengths visually.
  const p1x = (baseWidth - topVis) / 2;
  const p1y = (baseHeight - leftVis) / 2;

  const p2x = baseWidth - (baseWidth - topVis) / 2;
  const p2y = (baseHeight - rightVis) / 2;

  const p3x = baseWidth - (baseWidth - botVis) / 2;
  const p3y = baseHeight - (baseHeight - rightVis) / 2;

  const p4x = (baseWidth - botVis) / 2;
  const p4y = baseHeight - (baseHeight - leftVis) / 2;

  return [p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y];
};
