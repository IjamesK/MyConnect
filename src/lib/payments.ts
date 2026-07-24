export function getCanalBoxPaymentCode(routerSerial?: string | null) {
  if (!routerSerial) return "";

  const cleaned = routerSerial
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "");

  // Example: ZTEGD9D2C9DE -> D9D2C9DE
  if (cleaned.startsWith("ZTEG") && cleaned.length > 8) {
    return cleaned.slice(-8);
  }

  // Fallback: if only D9D2C9DE was stored
  return cleaned;
}

export function getCanalBoxPaymentLink(routerSerial?: string | null) {
  const code = getCanalBoxPaymentCode(routerSerial);

  if (!code) return "";

  return `https://canalbox.ppay.link/${code}`;
}
