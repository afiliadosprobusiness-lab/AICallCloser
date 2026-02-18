export const OUTBOUND_CALLER_ID_MARKER = "[outbound]";

export function hasOutboundMarker(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return value.toLowerCase().includes(OUTBOUND_CALLER_ID_MARKER);
}

export function stripOutboundMarker(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const cleaned = value
    .replace(new RegExp(`\\s*${OUTBOUND_CALLER_ID_MARKER}\\s*`, "gi"), " ")
    .trim();

  return cleaned.length > 0 ? cleaned : null;
}

export function withOutboundMarker(value: string | null | undefined) {
  const base = stripOutboundMarker(value);
  return base ? `${base} ${OUTBOUND_CALLER_ID_MARKER}` : OUTBOUND_CALLER_ID_MARKER;
}
