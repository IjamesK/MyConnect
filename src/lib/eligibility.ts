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
  locationSource?: "gps" | "gps_adjusted" | "manual";
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
    statusLabel: "Location captured",
    summary:
      "Your new location has been captured. Our team will check service availability and update you.",
    currentLatitude: data.latitude,
    currentLongitude: data.longitude,
    accuracyMeters: data.accuracyMeters ?? null,
    newAddress: data.newAddress,
    landmark: data.landmark,
    nearestZoneName: null,
    nearestDistanceMeters: null,
    matchedZoneId: null,
    recommendedAction: "Copy and paste coordinates to Mapbox to test eligibility.",
    checkedAt: new Date().toISOString(),
    source: "browser_geolocation",
    locationSource: "gps",
  };
}

export function createManualEligibilityReview(data: {
  newAddress: string;
  landmark: string;
}): MoveEligibilityCheck {
  return {
    status: "location_needed",
    statusLabel: "Location not captured",
    summary:
      "Location was not captured. Please try again while standing at the new place or contact support for help.",
    currentLatitude: null,
    currentLongitude: null,
    accuracyMeters: null,
    newAddress: data.newAddress,
    landmark: data.landmark,
    nearestZoneName: null,
    nearestDistanceMeters: null,
    matchedZoneId: null,
    recommendedAction: "Ask the customer to submit coordinates again or schedule a manual site survey.",
    checkedAt: new Date().toISOString(),
    source: "manual_review",
    locationSource: "manual",
  };
}
