export type EligibilityStatus =
  | "coordinates_captured"
  | "location_needed"
  | "eligible"
  | "survey_required"
  | "not_available";

export type MoveEligibilityCheck = {
  status: EligibilityStatus;
  statusLabel: string;
  summary: string;
  currentLatitude: number | null;
  currentLongitude: number | null;
  accuracyMeters: number | null;
  newAddress: string;
  landmark: string;
  nearestZoneName: string | null;
  nearestDistanceMeters: number | null;
  matchedZoneId: string | null;
  recommendedAction: string;
  checkedAt: string;
  source: "browser_geolocation" | "manual_review";
};

export function eligibilityStatusTone(status: EligibilityStatus) {
  if (status === "coordinates_captured" || status === "eligible") return "success";
  if (status === "survey_required") return "warning";
  if (status === "not_available") return "danger";
  return "muted";
}

export async function runMoveEligibilityCheck(data: {
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  newAddress: string;
  landmark: string;
}): Promise<MoveEligibilityCheck> {
  return {
    status: "coordinates_captured",
    statusLabel: "Coordinates captured",
    summary:
      "The customer's exact GPS coordinates have been attached to this move request. Staff should enter these coordinates into the CanalBox Mapbox eligibility tool to confirm service availability.",
    currentLatitude: data.latitude,
    currentLongitude: data.longitude,
    accuracyMeters: data.accuracyMeters ?? null,
    newAddress: data.newAddress,
    landmark: data.landmark,
    nearestZoneName: null,
    nearestDistanceMeters: null,
    matchedZoneId: null,
    recommendedAction:
      "Copy the latitude and longitude into the CanalBox Mapbox eligibility tool, then update this ticket with the eligibility result or site-survey decision.",
    checkedAt: new Date().toISOString(),
    source: "browser_geolocation",
  };
}

export function createManualEligibilityReview(data: {
  newAddress: string;
  landmark: string;
}): MoveEligibilityCheck {
  return {
    status: "location_needed",
    statusLabel: "Coordinates not captured",
    summary:
      "The customer's live GPS coordinates were not captured. Staff should contact the customer or ask them to submit again while standing at the new location.",
    currentLatitude: null,
    currentLongitude: null,
    accuracyMeters: null,
    newAddress: data.newAddress,
    landmark: data.landmark,
    nearestZoneName: null,
    nearestDistanceMeters: null,
    matchedZoneId: null,
    recommendedAction:
      "Ask the customer to allow location access at the new place, or schedule a manual site survey if GPS capture is not possible.",
    checkedAt: new Date().toISOString(),
    source: "manual_review",
  };
}
