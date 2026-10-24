export const MOVE_POLICY = "CanalBox does not charge for a move. Your account must be active to initiate one; if inactive, resubscribe first. At the new premises, open Moving / Location Check and capture your location so you do not need to pick coordinates. Alternatively, copy the exact destination coordinates from Google Maps and enter them in the move form. Staff will confirm service availability; do not disconnect or move fibre equipment yourself.";
export function canInitiateMove(status?: string | null) {
  return status?.trim().toLowerCase() === 'active';
}
export function parseMoveCoordinates(value: string): { latitude: number; longitude: number } | null {
  const match = value.trim().match(/^([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const latitude = Number(match[1]), longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}
export function hasMoveCoordinates(value: { currentLatitude: number | null; currentLongitude: number | null } | null) {
  return !!value && typeof value.currentLatitude === 'number' && typeof value.currentLongitude === 'number' && Number.isFinite(value.currentLatitude) && Number.isFinite(value.currentLongitude) && Math.abs(value.currentLatitude) <= 90 && Math.abs(value.currentLongitude) <= 180;
}
